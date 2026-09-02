// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract FaceVerification {
    struct Verification {
        bytes32 dataHash;
        string sourceUrl;
        uint256 timestamp;
        address verifier;
    }

    Verification[] public verifications;

    event DataVerified(
        bytes32 indexed dataHash,
        string sourceUrl,
        uint256 timestamp,
        address verifier
    );

    function verifyData(
        bytes32 _dataHash,
        string memory _sourceUrl
    ) public {
        verifications.push(
            Verification({
                dataHash: _dataHash,
                sourceUrl: _sourceUrl,
                timestamp: block.timestamp,
                verifier: msg.sender
            })
        );

        emit DataVerified(
            _dataHash,
            _sourceUrl,
            block.timestamp,
            msg.sender
        );
    }

    function getVerification(uint256 _index)
        public
        view
        returns (
            bytes32,
            string memory,
            uint256,
            address
        )
    {
        Verification memory v = verifications[_index];

        return (
            v.dataHash,
            v.sourceUrl,
            v.timestamp,
            v.verifier
        );
    }

    function getVerificationCount()
        public
        view
        returns (uint256)
    {
        return verifications.length;
    }
}