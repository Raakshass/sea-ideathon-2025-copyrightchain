const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting SEA Ideathon 2025 Deployment...\n");
  console.log("🏆 Deploying Science + Economics + Art (SEA) Ecosystem");
  console.log("=" * 60);

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // Step 1: Deploy MockVNST token
  console.log("🇻🇳 Deploying VNST (Vietnam Stable Token)...");
  const MockVNST = await hre.ethers.deployContract("MockVNST");
  await MockVNST.waitForDeployment();
  const vnstAddress = await MockVNST.getAddress();
  console.log("✅ MockVNST deployed to:", vnstAddress);

  // Step 2: Deploy MockvBTC token  
  console.log("\n₿ Deploying vBTC (Virtual Bitcoin Token)...");
  const MockvBTC = await hre.ethers.deployContract("MockvBTC");
  await MockvBTC.waitForDeployment();
  const vbtcAddress = await MockvBTC.getAddress();
  console.log("✅ MockvBTC deployed to:", vbtcAddress);

  // Step 3: Deploy enhanced CopyrightChain with both token addresses
  console.log("\n🎨 Deploying Enhanced CopyrightChain (SEA Integration)...");
  const CopyrightChain = await hre.ethers.deployContract("CopyrightChain", [vnstAddress, vbtcAddress]);
  await CopyrightChain.waitForDeployment();
  const copyrightAddress = await CopyrightChain.getAddress();
  console.log("✅ CopyrightChain deployed to:", copyrightAddress);

  // Step 4: Setup initial tokens for testing
  console.log("\n🎁 Setting up test tokens...");
  
  // Give deployer free VNST tokens
  await MockVNST.getFreeVNST();
  const vnstBalance = await MockVNST.balanceOf(deployer.address);
  console.log("✅ VNST balance:", hre.ethers.formatEther(vnstBalance), "VNST");
  
  // Give deployer free vBTC tokens  
  await MockvBTC.getFreevBTC();
  const vbtcBalance = await MockvBTC.balanceOf(deployer.address);
  console.log("✅ vBTC balance:", hre.ethers.formatUnits(vbtcBalance, 8), "vBTC");

  // Step 5: Get contract fees for display
  const basicFee = await CopyrightChain.basicRegistrationFee();
  const premiumFee = await CopyrightChain.premiumRegistrationFee(); 
  const aiFee = await CopyrightChain.aiVerificationFee();

  // Step 6: Display comprehensive deployment summary
  console.log("\n" + "=".repeat(80));
  console.log("🎉 SEA IDEATHON 2025 DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(80));
  
  console.log("\n🏗️  DEPLOYED CONTRACTS:");
  console.log("   🇻🇳 VNST Token (Economics):", vnstAddress);
  console.log("   ₿  vBTC Token (Science):", vbtcAddress);
  console.log("   🎨 CopyrightChain (Art):", copyrightAddress);
  
  console.log("\n💰 TOKEN BALANCES:");
  console.log("   📊 VNST Balance:", hre.ethers.formatEther(vnstBalance), "VNST");
  console.log("   ⚡ vBTC Balance:", hre.ethers.formatUnits(vbtcBalance, 8), "vBTC");
  
  console.log("\n💵 REGISTRATION FEES:");
  console.log("   📝 Basic Registration:", hre.ethers.formatEther(basicFee), "VNST");
  console.log("   ⭐ Premium Registration:", hre.ethers.formatEther(premiumFee), "VNST");
  console.log("   🤖 AI Verification:", hre.ethers.formatUnits(aiFee, 8), "vBTC");
  
  console.log("\n🔗 NETWORK INFORMATION:");
  console.log("   📡 Network: Hardhat Localhost");
  console.log("   🌐 RPC URL: http://127.0.0.1:8545");
  console.log("   🆔 Chain ID: 31337");
  console.log("   👤 Owner:", deployer.address);
  
  console.log("\n🏆 SEA IDEATHON FEATURES:");
  console.log("   🧪 SCIENCE: AI-powered artwork verification using vBTC");
  console.log("   💼 ECONOMICS: Dual-token economy with VNST/vBTC payments");
  console.log("   🎨 ART: Blockchain copyright protection and licensing");
  
  console.log("\n📋 INTEGRATION CHECKLIST:");
  console.log("   ✅ VNST token integration (Economics component)");
  console.log("   ✅ vBTC token integration (Science component)");
  console.log("   ✅ Copyright protection (Art component)");
  console.log("   ✅ AI verification system (Science component)");
  console.log("   ✅ Licensing marketplace (Economics component)");
  console.log("   ✅ Revenue tracking and creator earnings");
  
  console.log("=" * 80);
  console.log("🚀 Ready for SEA Ideathon 2025 submission!");
  console.log("=" * 80);

  // Return addresses for frontend configuration
  return {
    vnstAddress,
    vbtcAddress, 
    copyrightAddress,
    deployerAddress: deployer.address,
    fees: {
      basic: hre.ethers.formatEther(basicFee),
      premium: hre.ethers.formatEther(premiumFee),
      ai: hre.ethers.formatUnits(aiFee, 8)
    }
  };
}

main()
  .then(() => {
    console.log("\n🎯 Next steps:");
    console.log("   1. Update frontend with new contract addresses");
    console.log("   2. Test complete SEA functionality");
    console.log("   3. Create demo video and documentation");
    console.log("   4. Submit to SEA Ideathon 2025!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
