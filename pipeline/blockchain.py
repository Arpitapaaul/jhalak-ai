import json
import os
from pathlib import Path

from dotenv import load_dotenv
from web3 import Web3


class BlockchainService:

    def __init__(self):

        # -----------------------------------
        # LOAD ENVIRONMENT VARIABLES
        # -----------------------------------

        project_root = Path(__file__).parent.parent

        # Load blockchain/.env
        blockchain_env = project_root / "blockchain" / ".env"

        if blockchain_env.exists():
          load_dotenv(blockchain_env, override=True)

        # -----------------------------------
        # SEPOLIA CONFIGURATION
        # -----------------------------------

        self.rpc_url = os.getenv("SEPOLIA_RPC_URL")
        self.private_key = os.getenv("SEPOLIA_PRIVATE_KEY")
        self.contract_address = (
            "0x5010122b7c23631140f8e11e4b276f48d7634d1b"
        )

        if not self.rpc_url:
            raise ValueError(
                "SEPOLIA_RPC_URL is not configured."
            )

        if not self.private_key:
            raise ValueError(
                "SEPOLIA_PRIVATE_KEY is not configured."
            )

        # -----------------------------------
        # VALIDATE PRIVATE KEY
        # -----------------------------------

        self.private_key = self.private_key.strip()

        if not self.private_key.startswith("0x"):
            self.private_key = "0x" + self.private_key

        if len(self.private_key) != 66:
            raise ValueError(
                "SEPOLIA_PRIVATE_KEY must be a 32-byte "
                "hexadecimal private key."
            )

        # -----------------------------------
        # CONNECT TO SEPOLIA
        # -----------------------------------

        self.w3 = Web3(
            Web3.HTTPProvider(self.rpc_url)
        )

        if not self.w3.is_connected():
            raise ConnectionError(
                "Could not connect to Ethereum Sepolia."
            )

        print("Connected to Ethereum Sepolia.")

        # -----------------------------------
        # ACCOUNT
        # -----------------------------------

        self.account = (
            self.w3.eth.account
            .from_key(self.private_key)
        )

        self.account_address = self.account.address

        print(
            f"Using blockchain account: "
            f"{self.account_address}"
        )

        # -----------------------------------
        # LOAD FACE VERIFICATION ABI
        # -----------------------------------

        abi_path = (
            project_root
            / "blockchain"
            / "artifacts"
            / "contracts"
            / "FaceVerification.sol"
            / "FaceVerification.json"
        )

        if not abi_path.exists():
            raise FileNotFoundError(
                f"Contract ABI not found: {abi_path}"
            )

        with open(
            abi_path,
            "r",
            encoding="utf-8"
        ) as file:

            artifact = json.load(file)

        self.abi = artifact["abi"]

        # -----------------------------------
        # CONTRACT INSTANCE
        # -----------------------------------

        self.contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(
                self.contract_address
            ),
            abi=self.abi
        )

    # ---------------------------------------
    # STORE VERIFICATION ON BLOCKCHAIN
    # ---------------------------------------

    def store_verification(
        self,
        data_hash,
        source_url
    ):
        """
        Store discovered web/social-media data
        hash and source URL on Ethereum Sepolia.
        """

        # -----------------------------------
        # VALIDATE HASH
        # -----------------------------------

        if not isinstance(data_hash, str):
            raise TypeError(
                "data_hash must be a hexadecimal string."
            )

        data_hash = data_hash.removeprefix("0x")

        if len(data_hash) != 64:
            raise ValueError(
                "data_hash must contain exactly "
                "64 hexadecimal characters."
            )

        try:
            data_hash_bytes = bytes.fromhex(
                data_hash
            )
        except ValueError as error:
            raise ValueError(
                "data_hash contains invalid hexadecimal characters."
            ) from error

        # -----------------------------------
        # VALIDATE URL
        # -----------------------------------

        if not isinstance(source_url, str):
            raise TypeError(
                "source_url must be a string."
            )

        if not source_url.strip():
            raise ValueError(
                "source_url cannot be empty."
            )

        # -----------------------------------
        # GET NONCE
        # -----------------------------------

        nonce = self.w3.eth.get_transaction_count(
            self.account_address,
            "pending"
        )

        # -----------------------------------
        # GET GAS PRICE
        # -----------------------------------

        latest_block = self.w3.eth.get_block("latest")
        base_fee = latest_block["baseFeePerGas"]

        max_priority_fee = self.w3.to_wei(2, "gwei")
        max_fee = (base_fee * 2) + max_priority_fee    

        # -----------------------------------
        # BUILD TRANSACTION
        # -----------------------------------

        transaction = (
            self.contract.functions
            .verifyData(
                data_hash_bytes,
                source_url
            )
            .build_transaction({
                "from": self.account_address,
                "nonce": nonce,
                "chainId": 11155111,
                "gas": 500000,
                "maxPriorityFeePerGas": max_priority_fee,
                "maxFeePerGas": max_fee
            })
        )

        # -----------------------------------
        # SIGN TRANSACTION
        # -----------------------------------

        signed_transaction = (
            self.w3.eth.account
            .sign_transaction(
                transaction,
                private_key=self.private_key
            )
        )

        # -----------------------------------
        # SEND TRANSACTION
        # -----------------------------------

        tx_hash = (
            self.w3.eth
            .send_raw_transaction(
                signed_transaction.raw_transaction
            )
        )

        print(
            f"Sepolia blockchain transaction sent: "
            f"{tx_hash.hex()}"
        )

        # -----------------------------------
        # WAIT FOR CONFIRMATION
        # -----------------------------------

        receipt = (
            self.w3.eth
            .wait_for_transaction_receipt(
                tx_hash
            )
        )

        if receipt.status != 1:
            raise RuntimeError(
                "Blockchain transaction failed."
            )

        print(
            f"Transaction confirmed in block "
            f"{receipt.blockNumber}"
        )

        # -----------------------------------
        # RETURN RESULT
        # -----------------------------------

        return {
            "transaction_hash": tx_hash.hex(),
            "block_number": receipt.blockNumber,
            "status": receipt.status
        }

    # ---------------------------------------
    # READ VERIFICATION FROM BLOCKCHAIN
    # ---------------------------------------

    def get_verification(
        self,
        verification_index
    ):
        """
        Read verification data directly
        from Ethereum Sepolia.
        """

        result = (
            self.contract.functions
            .getVerification(
                verification_index
            )
            .call()
        )

        return {
            "data_hash": result[0].hex(),
            "source_url": result[1],
            "timestamp": result[2],
            "verifier": result[3]
        }

    # ---------------------------------------
    # GET TOTAL VERIFICATIONS
    # ---------------------------------------

    def get_verification_count(self):
        """
        Return the total number of
        blockchain verification records.
        """

        return (
            self.contract.functions
            .getVerificationCount()
            .call()
        )

    # ---------------------------------------
    # RE-VERIFY DATA AGAINST BLOCKCHAIN
    # ---------------------------------------

    def verify_against_blockchain(
        self,
        data_hash,
        verification_index
    ):
        """
        Compare the current data hash with
        the hash stored on Ethereum Sepolia.

        Returns True if both hashes match.
        """

        # -----------------------------------
        # VALIDATE CURRENT HASH
        # -----------------------------------

        if not isinstance(data_hash, str):
            raise TypeError(
                "data_hash must be a hexadecimal string."
            )

        current_hash = data_hash.removeprefix(
            "0x"
        ).lower()

        if len(current_hash) != 64:
            raise ValueError(
                "data_hash must contain exactly "
                "64 hexadecimal characters."
            )

        try:
            bytes.fromhex(current_hash)
        except ValueError as error:
            raise ValueError(
                "data_hash contains invalid hexadecimal characters."
            ) from error

        # -----------------------------------
        # READ BLOCKCHAIN RECORD
        # -----------------------------------

        blockchain_record = (
            self.get_verification(
                verification_index
            )
        )

        stored_hash = (
            blockchain_record["data_hash"]
            .removeprefix("0x")
            .lower()
        )

        # -----------------------------------
        # COMPARE HASHES
        # -----------------------------------

        is_verified = (
            current_hash == stored_hash
        )

        # -----------------------------------
        # RETURN VERIFICATION RESULT
        # -----------------------------------

        return {
            "verified": is_verified,
            "current_hash": current_hash,
            "stored_hash": stored_hash,
            "source_url": blockchain_record[
                "source_url"
            ],
            "timestamp": blockchain_record[
                "timestamp"
            ],
            "verifier": blockchain_record[
                "verifier"
            ]
        }