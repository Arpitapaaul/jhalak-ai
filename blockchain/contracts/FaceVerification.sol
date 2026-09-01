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
        # DEPLOYED CONTRACT ADDRESS
        # -----------------------------------

        self.contract_address = (
            "0x5FbDB2315678afecb367f032d93F642f64180aa3"
        )

        # -----------------------------------
        # HARDHAT LOCAL ACCOUNT #0
        # -----------------------------------
        # This is Hardhat's public test account.
        # Use this ONLY for local development.

        self.private_key = (
            "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        )

        # -----------------------------------
        # CONNECT TO HARDHAT
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
        # LOAD CONTRACT ABI
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
        Store the hash of discovered web/social-media
        data and its source URL on the blockchain.
        """

        # -----------------------------------
        # VALIDATE HASH
        # -----------------------------------

        if not isinstance(data_hash, str):
            raise TypeError(
                "data_hash must be a hexadecimal string."
            )

        # Remove optional 0x prefix
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
        # VALIDATE SOURCE URL
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
            "Blockchain transaction sent: "
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

        print(
            "Blockchain confirmation received."
        )

        print(
            f"Block number: {receipt.blockNumber}"
        )

        print(
            f"Transaction status: {receipt.status}"
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
        Read a previously stored verification
        directly from the blockchain.
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
        Return the total number of verifications
        stored on the blockchain.
        """

        return (
            self.contract.functions
            .getVerificationCount()
            .call()
        )