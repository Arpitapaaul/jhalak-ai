import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FaceVerificationModule = buildModule(
  "FaceVerificationModule",
  (m) => {
    const faceVerification = m.contract("FaceVerification");

    return {
      faceVerification,
    };
  }
);

export default FaceVerificationModule;