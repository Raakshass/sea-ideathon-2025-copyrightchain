// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract CopyrightChain {
    struct Artwork {
        address creator;
        string title;
        string ipfsHash;
        uint256 timestamp;
        uint256 vnstPaid;
        uint256 vbtcPaid;
        bool isPremium;
        bool isAIVerified;
        uint8 aiConfidenceScore;
        string aiVerificationHash;
        uint256 licensePrice;
        bool isForSale;
    }

    struct License {
        bytes32 artworkId;
        address licensee;
        uint256 price;
        uint256 timestamp;
        uint256 duration;
        bool isActive;
    }

    mapping(bytes32 => Artwork) public artworks;
    mapping(bytes32 => License[]) public artworkLicenses;
    mapping(address => bytes32[]) public userArtworks;
    mapping(address => uint256) public creatorEarnings;
    
    // Token contracts
    IERC20 public vnstToken;
    IERC20 public vbtcToken;
    
    // Fees (in wei)
    uint256 public basicRegistrationFee = 100 * 10**18; // 100 VNST
    uint256 public premiumRegistrationFee = 500 * 10**18; // 500 VNST
    uint256 public aiVerificationFee = 5000000; // 0.05 vBTC (5,000,000 units with 8 decimals)
    
    address public owner;
    uint256 public totalRegistrations;
    uint256 public totalLicensesSold;
    uint256 public totalRevenue;
    
    // Events
    event Registered(
        bytes32 indexed id, 
        address indexed creator, 
        string title, 
        string ipfsHash, 
        uint256 timestamp,
        uint256 vnstPaid,
        bool isPremium
    );
    
    event AIAnalysisRequested(
        bytes32 indexed artworkId, 
        string ipfsHash, 
        address indexed requester,
        uint256 vbtcPaid
    );
    
    event AIVerified(
        bytes32 indexed artworkId,
        uint8 confidenceScore,
        string verificationHash,
        uint256 vbtcPaid
    );
    
    event LicensePurchased(
        bytes32 indexed artworkId,
        address indexed licensee,
        uint256 price,
        uint256 duration
    );
    
    event ArtworkListedForSale(
        bytes32 indexed artworkId,
        uint256 price
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyArtworkCreator(bytes32 artworkId) {
        require(artworks[artworkId].creator == msg.sender, "Only artwork creator can call this function");
        _;
    }

    constructor(address _vnstTokenAddress, address _vbtcTokenAddress) {
        owner = msg.sender;
        vnstToken = IERC20(_vnstTokenAddress);
        vbtcToken = IERC20(_vbtcTokenAddress);
    }

    // Core registration function with VNST payment
    function registerArtwork(
        string memory title, 
        string memory ipfsHash, 
        bool premium
    ) public returns (bytes32) {
        bytes32 id = keccak256(abi.encodePacked(msg.sender, title, ipfsHash, block.timestamp));
        require(artworks[id].timestamp == 0, "Artwork already registered");

        uint256 fee = premium ? premiumRegistrationFee : basicRegistrationFee;
        
        // Transfer VNST tokens from user to contract
        require(
            vnstToken.transferFrom(msg.sender, address(this), fee),
            "VNST payment failed"
        );

        artworks[id] = Artwork({
            creator: msg.sender,
            title: title,
            ipfsHash: ipfsHash,
            timestamp: block.timestamp,
            vnstPaid: fee,
            vbtcPaid: 0,
            isPremium: premium,
            isAIVerified: false,
            aiConfidenceScore: 0,
            aiVerificationHash: "",
            licensePrice: 0,
            isForSale: false
        });
        
        userArtworks[msg.sender].push(id);
        totalRegistrations++;
        totalRevenue += fee;
        
        emit Registered(id, msg.sender, title, ipfsHash, block.timestamp, fee, premium);
        return id;
    }

    // Request AI Verification (triggers external AI backend)
    function requestAIVerification(bytes32 artworkId) public onlyArtworkCreator(artworkId) {
        require(artworks[artworkId].timestamp > 0, "Artwork does not exist");
        require(!artworks[artworkId].isAIVerified, "Artwork already AI verified");
        
        // Transfer vBTC tokens for AI verification
        require(
            vbtcToken.transferFrom(msg.sender, address(this), aiVerificationFee),
            "vBTC payment failed"
        );

        artworks[artworkId].vbtcPaid = aiVerificationFee;
        
        // Emit event for AI backend to process
        emit AIAnalysisRequested(artworkId, artworks[artworkId].ipfsHash, msg.sender, aiVerificationFee);
    }

    // Submit AI Results (called after AI analysis completes) - REMOVED ACCESS CONTROL FOR DEMO
    function submitAIResults(
        bytes32 artworkId, 
        uint8 confidenceScore, 
        string memory verificationHash
    ) public {
        require(artworks[artworkId].timestamp > 0, "Artwork does not exist");
        require(artworks[artworkId].vbtcPaid > 0, "AI verification not paid for");
        require(confidenceScore >= 65 && confidenceScore <= 100, "Invalid confidence score");
        
        artworks[artworkId].isAIVerified = true;
        artworks[artworkId].aiConfidenceScore = confidenceScore;
        artworks[artworkId].aiVerificationHash = verificationHash;
        
        emit AIVerified(artworkId, confidenceScore, verificationHash, artworks[artworkId].vbtcPaid);
    }

    // Economics component: Licensing marketplace
    function listArtworkForLicensing(bytes32 artworkId, uint256 priceInVNST) public onlyArtworkCreator(artworkId) {
        require(artworks[artworkId].timestamp > 0, "Artwork does not exist");
        require(priceInVNST > 0, "Price must be greater than 0");
        
        artworks[artworkId].licensePrice = priceInVNST;
        artworks[artworkId].isForSale = true;
        
        emit ArtworkListedForSale(artworkId, priceInVNST);
    }

    function purchaseLicense(bytes32 artworkId, uint256 durationInDays) public {
        require(artworks[artworkId].timestamp > 0, "Artwork does not exist");
        require(artworks[artworkId].isForSale, "Artwork not for sale");
        require(artworks[artworkId].creator != msg.sender, "Cannot license your own artwork");
        
        uint256 totalPrice = artworks[artworkId].licensePrice * durationInDays;
        
        // Transfer VNST from buyer to creator
        require(
            vnstToken.transferFrom(msg.sender, artworks[artworkId].creator, totalPrice),
            "License payment failed"
        );
        
        // Create license record
        License memory newLicense = License({
            artworkId: artworkId,
            licensee: msg.sender,
            price: totalPrice,
            timestamp: block.timestamp,
            duration: durationInDays * 1 days,
            isActive: true
        });
        
        artworkLicenses[artworkId].push(newLicense);
        creatorEarnings[artworks[artworkId].creator] += totalPrice;
        totalLicensesSold++;
        
        emit LicensePurchased(artworkId, msg.sender, totalPrice, durationInDays * 1 days);
    }

    // View functions
    function getArtwork(bytes32 id) public view returns (Artwork memory) {
        return artworks[id];
    }
    
    function getUserArtworks(address user) public view returns (bytes32[] memory) {
        return userArtworks[user];
    }
    
    function getArtworkLicenses(bytes32 artworkId) public view returns (License[] memory) {
        return artworkLicenses[artworkId];
    }
    
    function getMarketplaceStats() public view returns (uint256, uint256, uint256) {
        return (totalRegistrations, totalLicensesSold, totalRevenue);
    }

    // Admin functions
    function updateFees(uint256 _basicFee, uint256 _premiumFee, uint256 _aiFee) public onlyOwner {
        basicRegistrationFee = _basicFee;
        premiumRegistrationFee = _premiumFee;
        aiVerificationFee = _aiFee;
    }
    
    function withdrawTokens() public onlyOwner {
        uint256 vnstBalance = vnstToken.balanceOf(address(this));
        uint256 vbtcBalance = vbtcToken.balanceOf(address(this));
        
        if (vnstBalance > 0) {
            require(vnstToken.transfer(owner, vnstBalance), "VNST withdrawal failed");
        }
        if (vbtcBalance > 0) {
            require(vbtcToken.transfer(owner, vbtcBalance), "vBTC withdrawal failed");
        }
    }
}
