import json
from pathlib import Path

from web3 import Web3


class BlockchainService:

    def __init__(self):

        # -----------------------------------
        # LOCAL HARDHAT BLOCKCHAIN
        # -----------------------------------

        self.rpc_url = "http://127.0.0.1:8545"

        # -----------------------------------
        # DEPLOYED FACE VERIFICATION CONTRACT
        # -----------------------------------

        self.contract_address = (
             "0xdc64a140aa3e981100a9beca4e685f962f0cf6c9"
        )

        # -----------------------------------
        # HARDHAT LOCAL ACCOUNT #0
        # -----------------------------------

        self.private_key = (
            "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        )

        # -----------------------------------
        # CONNECT TO LOCAL BLOCKCHAIN
        # -----------------------------------

        self.w3 = Web3(
            Web3.HTTPProvider(self.rpc_url)
        )

        if not self.w3.is_connected():
            raise ConnectionError(
                "Could not connect to Hardhat blockchain."
            )

        print("Connected to Hardhat blockchain.")

        # -----------------------------------
        # ACCOUNT
        # -----------------------------------

        self.account = self.w3.eth.accounts[0]

        print(
            f"Using blockchain account: {self.account}"
        )

        # -----------------------------------
        # LOAD FACE VERIFICATION ABI
        # -----------------------------------

        abi_path = (
            Path(__file__).parent.parent
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
        hash and source URL on blockchain.
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
            self.account,
            "pending"
        )

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
                "from": self.account,
                "nonce": nonce,
                "gas": 500000,
                "gasPrice": self.w3.eth.gas_price
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
            f"Blockchain transaction sent: "
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
        from the blockchain.
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
        the hash stored on the blockchain.

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