// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract FaceVerification {

    struct Verification {
        bytes32 imageHash;
        uint256 similarityScore;
        bool isMatch;
        uint256 timestamp;
    }

    uint256 public verificationCount;

    mapping(uint256 => Verification) public verifications;

    event VerificationStored(
        uint256 indexed verificationId,
        bytes32 indexed imageHash,
        uint256 similarityScore,
        bool isMatch,
        uint256 timestamp
    );

    function storeVerification(
        bytes32 imageHash,
        uint256 similarityScore,
        bool isMatch
    ) external {

        verificationCount++;

        verifications[verificationCount] = Verification({
            imageHash: imageHash,
            similarityScore: similarityScore,
            isMatch: isMatch,
            timestamp: block.timestamp
        });

        emit VerificationStored(
            verificationCount,
            imageHash,
            similarityScore,
            isMatch,
            block.timestamp
        );
    }

    function getVerification(
        uint256 verificationId
    )
        external
        view
        returns (
            bytes32 imageHash,
            uint256 similarityScore,
            bool isMatch,
            uint256 timestamp
        )
    {
        Verification memory verification =
            verifications[verificationId];

        return (
            verification.imageHash,
            verification.similarityScore,
            verification.isMatch,
            verification.timestamp
        );
    }
}