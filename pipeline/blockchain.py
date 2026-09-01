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

        self.private_key = (
            "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        )

        # -----------------------------------
        # CONNECT TO BLOCKCHAIN
        # -----------------------------------

        self.w3 = Web3(
            Web3.HTTPProvider(self.rpc_url)
        )

        if not self.w3.is_connected():
            raise ConnectionError(
                "Could not connect to Hardhat blockchain."
            )

        # -----------------------------------
        # LOAD FACE VERIFICATION ABI
        # -----------------------------------

        abi_path = (
            Path(__file__).parent.parent
            / "blockchain"
            / "artifacts"
            / "contracts"
            / "Counter.sol"
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

        # -----------------------------------
        # CONTRACT INSTANCE
        # -----------------------------------

        self.contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(
                self.contract_address
            ),
            abi=artifact["abi"]
        )

        # -----------------------------------
        # LOCAL ACCOUNT
        # -----------------------------------

        self.account = (
            self.w3.eth.accounts[0]
        )

    # ---------------------------------------
    # STORE VERIFICATION ON BLOCKCHAIN
    # ---------------------------------------

    def store_verification(
        self,
        image_hash,
        similarity_score,
        is_match
    ):

        # SHA-256:
        # 64 hexadecimal characters
        #
        # Convert hexadecimal string
        # into bytes32 for Solidity.

        image_hash_bytes = bytes.fromhex(
            image_hash
        )

        # -----------------------------------
        # CONVERT SCORE
        # -----------------------------------
        #
        # Example:
        # 0.5639 -> 5639
        #
        # Solidity stores this as uint256.

        similarity_integer = int(
            round(
                similarity_score * 10000
            )
        )

        # -----------------------------------
        # GET TRANSACTION NONCE
        # -----------------------------------

        nonce = (
            self.w3.eth.get_transaction_count(
                self.account
            )
        )

        # -----------------------------------
        # BUILD TRANSACTION
        # -----------------------------------

        transaction = (
            self.contract.functions
            .storeVerification(
                image_hash_bytes,
                similarity_integer,
                is_match
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

        # -----------------------------------
        # RETURN RESULT
        # -----------------------------------

        return {
            "transaction_hash": tx_hash.hex(),
            "block_number": receipt.blockNumber,
            "status": receipt.status
        }