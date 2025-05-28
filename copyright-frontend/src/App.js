import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  Alert,
  Grid,
  AppBar,
  Toolbar,
  CircularProgress,
  Paper,
  FormControlLabel,
  Switch,
  Chip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
  Badge
} from '@mui/material';
import {
  AccountBalanceWallet,
  Copyright,
  CloudUpload,
  Verified,
  History,
  MonetizationOn,
  SmartToy,
  Storefront,
  TrendingUp,
  AttachMoney
} from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Dark theme with beautiful gradients
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00d4aa',
    },
    secondary: {
      main: '#ff6b6b',
    },
    background: {
      default: '#0a0e1a',
      paper: '#1a1f2e',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Updated contract addresses from deployment
const vnstTokenAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
const vbtcTokenAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
const copyrightChainAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";

// Contract ABIs
const vnstABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function getFreeVNST() external",
  "function transfer(address to, uint256 amount) external returns (bool)"
];

const vbtcABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function getFreevBTC() external",
  "function transfer(address to, uint256 amount) external returns (bool)"
];

const copyrightABI = [
  "function registerArtwork(string memory title, string memory ipfsHash, bool premium) public returns (bytes32)",
  "function requestAIVerification(bytes32 artworkId) public",
  "function listArtworkForLicensing(bytes32 artworkId, uint256 priceInVNST) public",
  "function purchaseLicense(bytes32 artworkId, uint256 durationInDays) public",
  "function getArtwork(bytes32 id) public view returns (tuple(address creator, string title, string ipfsHash, uint256 timestamp, uint256 vnstPaid, uint256 vbtcPaid, bool isPremium, bool isAIVerified, uint8 aiConfidenceScore, string aiVerificationHash, uint256 licensePrice, bool isForSale))",
  "function getUserArtworks(address user) public view returns (bytes32[])",
  "function getMarketplaceStats() public view returns (uint256, uint256, uint256)",
  "function creatorEarnings(address creator) public view returns (uint256)",
  "function basicRegistrationFee() public view returns (uint256)",
  "function premiumRegistrationFee() public view returns (uint256)",
  "function aiVerificationFee() public view returns (uint256)",
  "event Registered(bytes32 indexed id, address indexed creator, string title, string ipfsHash, uint256 timestamp, uint256 vnstPaid, bool isPremium)",
  "event AIVerified(bytes32 indexed artworkId, uint8 confidenceScore, string verificationHash, uint256 vbtcPaid)",
  "event LicensePurchased(bytes32 indexed artworkId, address indexed licensee, uint256 price, uint256 duration)"
];

function App() {
  const [account, setAccount] = useState('');
  const [vnstContract, setVnstContract] = useState(null);
  const [vbtcContract, setVbtcContract] = useState(null);
  const [copyrightContract, setCopyrightContract] = useState(null);
  const [title, setTitle] = useState('');
  const [ipfsHash, setIpfsHash] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('info');
  const [registeredWorks, setRegisteredWorks] = useState([]);
  const [userArtworks, setUserArtworks] = useState([]);
  const [vnstBalance, setVnstBalance] = useState('0');
  const [vbtcBalance, setVbtcBalance] = useState('0');
  const [basicFee, setBasicFee] = useState('100');
  const [premiumFee, setPremiumFee] = useState('500');
  const [aiFee, setAiFee] = useState('0.05');
  const [tabValue, setTabValue] = useState(0);
  const [marketStats, setMarketStats] = useState({ registrations: 0, licenses: 0, revenue: 0 });
  const [creatorEarnings, setCreatorEarnings] = useState('0');

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // Initialize contracts
        const vnstInstance = new ethers.Contract(vnstTokenAddress, vnstABI, signer);
        const vbtcInstance = new ethers.Contract(vbtcTokenAddress, vbtcABI, signer);
        const copyrightInstance = new ethers.Contract(copyrightChainAddress, copyrightABI, signer);
        
        const address = await signer.getAddress();
        setAccount(address);
        setVnstContract(vnstInstance);
        setVbtcContract(vbtcInstance);
        setCopyrightContract(copyrightInstance);
        
        // Update balances and fees
        await updateBalances(vnstInstance, vbtcInstance, copyrightInstance, address);
        
        setStatus(`🎉 Wallet connected: ${address.substring(0, 6)}...${address.substring(38)}`);
        setStatusType('success');
      } else {
        setStatus('❌ Please install MetaMask to connect your wallet!');
        setStatusType('error');
      }
    } catch (error) {
      setStatus(`❌ Connection failed: ${error.message}`);
      setStatusType('error');
    }
  };

  const updateBalances = async (vnstInstance, vbtcInstance, copyrightInstance, address) => {
    try {
      // Get token balances
      const vnstBal = await vnstInstance.balanceOf(address);
      const vbtcBal = await vbtcInstance.balanceOf(address);
      setVnstBalance(ethers.formatEther(vnstBal));
      setVbtcBalance(ethers.formatUnits(vbtcBal, 8));
      
      // Get registration fees
      const basicFeeValue = await copyrightInstance.basicRegistrationFee();
      const premiumFeeValue = await copyrightInstance.premiumRegistrationFee();
      const aiFeeValue = await copyrightInstance.aiVerificationFee();
      setBasicFee(ethers.formatEther(basicFeeValue));
      setPremiumFee(ethers.formatEther(premiumFeeValue));
      setAiFee(ethers.formatUnits(aiFeeValue, 8));
      
      // Get user artworks
      const artworkIds = await copyrightInstance.getUserArtworks(address);
      const artworks = [];
      for (let id of artworkIds) {
        const artwork = await copyrightInstance.getArtwork(id);
        artworks.push({ id, ...artwork });
      }
      setUserArtworks(artworks);
      
      // Get marketplace stats
      const stats = await copyrightInstance.getMarketplaceStats();
      setMarketStats({
        registrations: stats[0].toString(),
        licenses: stats[1].toString(),
        revenue: ethers.formatEther(stats[2])
      });
      
      // Get creator earnings
      const earnings = await copyrightInstance.creatorEarnings(address);
      setCreatorEarnings(ethers.formatEther(earnings));
      
    } catch (error) {
      console.error('Error updating balances:', error);
    }
  };

  const getFreeTokens = async (tokenType) => {
    if (!vnstContract || !vbtcContract) return;
    
    try {
      setLoading(true);
      setStatus(`🎁 Getting free ${tokenType} tokens...`);
      setStatusType('info');
      
      if (tokenType === 'VNST') {
        const tx = await vnstContract.getFreeVNST();
        await tx.wait();
        setStatus('✅ Received 10,000 free VNST tokens!');
      } else {
        const tx = await vbtcContract.getFreevBTC();
        await tx.wait();
        setStatus('✅ Received 0.1 free vBTC tokens!');
      }
      
      await updateBalances(vnstContract, vbtcContract, copyrightContract, account);
      setStatusType('success');
    } catch (error) {
      setStatus(`❌ Failed to get ${tokenType}: ${error.message}`);
      setStatusType('error');
    } finally {
      setLoading(false);
    }
  };

  const registerArtwork = async () => {
    if (!copyrightContract || !vnstContract) {
      setStatus('⚠️ Please connect your wallet first!');
      setStatusType('warning');
      return;
    }

    if (!title || !ipfsHash) {
      setStatus('⚠️ Please fill in both title and IPFS hash!');
      setStatusType('warning');
      return;
    }

    const requiredFee = isPremium ? premiumFee : basicFee;
    const requiredFeeWei = ethers.parseEther(requiredFee);

    if (parseFloat(vnstBalance) < parseFloat(requiredFee)) {
      setStatus(`⚠️ Insufficient VNST balance. Need ${requiredFee} VNST for ${isPremium ? 'premium' : 'basic'} registration.`);
      setStatusType('warning');
      return;
    }

    try {
      setLoading(true);
      setStatus('💰 Approving VNST payment...');
      setStatusType('info');
      
      // Approve VNST spending
      const approveTx = await vnstContract.approve(copyrightChainAddress, requiredFeeWei);
      await approveTx.wait();
      
      setStatus('⏳ Registering artwork on blockchain...');
      
      // Register artwork
      const registerTx = await copyrightContract.registerArtwork(title, ipfsHash, isPremium);
      const receipt = await registerTx.wait();
      
      // Get artwork ID from event
      const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'Registered');
      const artworkId = event ? event.args[0] : null;
      
      await updateBalances(vnstContract, vbtcContract, copyrightContract, account);
      
      setStatus(`✅ ${isPremium ? 'Premium' : 'Basic'} artwork registered! Paid ${requiredFee} VNST. ID: ${artworkId ? artworkId.substring(0, 10) + '...' : 'Generated'}`);
      setStatusType('success');
      
      const newWork = {
        title,
        ipfsHash,
        timestamp: new Date().toLocaleString(),
        txHash: registerTx.hash,
        creator: account,
        vnstPaid: requiredFee,
        isPremium,
        artworkId
      };
      setRegisteredWorks(prev => [newWork, ...prev]);
      
      // Clear form
      setTitle('');
      setIpfsHash('');
      setIsPremium(false);
      
    } catch (error) {
      setStatus(`❌ Registration failed: ${error.message}`);
      setStatusType('error');
    } finally {
      setLoading(false);
    }
  };

  const requestAIVerification = async (artworkId) => {
    if (!copyrightContract || !vbtcContract) return;
    
    if (parseFloat(vbtcBalance) < parseFloat(aiFee)) {
      setStatus(`⚠️ Insufficient vBTC balance. Need ${aiFee} vBTC for AI verification.`);
      setStatusType('warning');
      return;
    }

    try {
      setLoading(true);
      setStatus('🤖 Requesting AI verification...');
      setStatusType('info');
      
      // Approve vBTC spending
      const aiFeeWei = ethers.parseUnits(aiFee, 8);
      const approveTx = await vbtcContract.approve(copyrightChainAddress, aiFeeWei);
      await approveTx.wait();
      
      // Request AI verification
      const verifyTx = await copyrightContract.requestAIVerification(artworkId);
      await verifyTx.wait();
      
      await updateBalances(vnstContract, vbtcContract, copyrightContract, account);
      
      setStatus(`✅ AI verification completed! Paid ${aiFee} vBTC.`);
      setStatusType('success');
      
    } catch (error) {
      setStatus(`❌ AI verification failed: ${error.message}`);
      setStatusType('error');
    } finally {
      setLoading(false);
    }
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: 'background.default' }}>
        {/* Header */}
        <AppBar position="static" sx={{ background: 'linear-gradient(45deg, #00d4aa, #007b8a)' }}>
          <Toolbar>
            <Copyright sx={{ mr: 2, fontSize: 32 }} />
            <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              CopyrightChain DApp - SEA Ideathon 2025
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {account && (
                <>
                  <Badge badgeContent="VNST" color="primary">
                    <Chip 
                      icon={<MonetizationOn />}
                      label={`${parseFloat(vnstBalance).toFixed(2)}`}
                      color="primary"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Badge>
                  <Badge badgeContent="vBTC" color="secondary">
                    <Chip 
                      icon={<SmartToy />}
                      label={`${parseFloat(vbtcBalance).toFixed(4)}`}
                      color="secondary"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Badge>
                </>
              )}
              <Button
                color="inherit"
                onClick={connectWallet}
                startIcon={<AccountBalanceWallet />}
                variant="outlined"
                sx={{ 
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderRadius: 3,
                  px: 3,
                }}
              >
                {account ? `${account.substring(0, 6)}...${account.substring(38)}` : 'Connect Wallet'}
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 4, pb: 4 }}>
          {/* Status Alert */}
          {status && (
            <Alert 
              severity={statusType} 
              sx={{ mb: 4, borderRadius: 3, fontSize: '1.1rem' }}
              onClose={() => setStatus('')}
            >
              {status}
            </Alert>
          )}

          {/* SEA Features Banner */}
          <Paper sx={{ mb: 4, p: 3, background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%)', borderRadius: 3 }}>
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>
              🏆 Science + Economics + Art Integration
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <SmartToy sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Science (AI)</Typography>
                  <Typography variant="body2" color="text.secondary">
                    AI-powered artwork verification using vBTC payments
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <TrendingUp sx={{ fontSize: 48, color: 'secondary.main', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Economics</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Dual-token economy with VNST licensing marketplace
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Copyright sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Art</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Blockchain copyright protection and licensing
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Main Content Tabs */}
          <Card sx={{ borderRadius: 4, background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%)' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} centered>
                <Tab label="🎨 Register Artwork" />
                <Tab label="🤖 AI Verification" />
                <Tab label="💰 Token Management" />
                <Tab label="📊 Dashboard" />
              </Tabs>
            </Box>

            {/* Tab 1: Register Artwork */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={8}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <CloudUpload sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      Register Artwork with VNST
                    </Typography>
                  </Box>
                  
                  <Box component="form" sx={{ '& > :not(style)': { mb: 3 } }}>
                    <TextField
                      fullWidth
                      label="Artwork Title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter your artwork's title"
                    />
                    
                    <TextField
                      fullWidth
                      label="IPFS Hash"
                      value={ipfsHash}
                      onChange={(e) => setIpfsHash(e.target.value)}
                      placeholder="QmVLwvmGehsrNEvhcCnnsw5RQNseohgEkFNN1848zNzdng"
                      helperText="Upload your file to IPFS and paste the hash here"
                    />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isPremium}
                          onChange={(e) => setIsPremium(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1">
                            Premium Registration ({premiumFee} VNST)
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Enhanced features, priority support, and extended protection
                          </Typography>
                        </Box>
                      }
                    />
                    
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={registerArtwork}
                      disabled={loading || !account || parseFloat(vnstBalance) < parseFloat(isPremium ? premiumFee : basicFee)}
                      sx={{ 
                        py: 2,
                        fontSize: '1.1rem',
                        borderRadius: 3,
                        background: isPremium 
                          ? 'linear-gradient(45deg, #ff6b6b, #ff8e53)'
                          : 'linear-gradient(45deg, #00d4aa, #007b8a)',
                      }}
                    >
                      {loading ? (
                        <CircularProgress size={28} color="inherit" />
                      ) : (
                        `🔐 ${isPremium ? 'Premium' : 'Basic'} Registration (${isPremium ? premiumFee : basicFee} VNST)`
                      )}
                    </Button>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 3, backgroundColor: 'rgba(0, 212, 170, 0.1)', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                      💰 Fee Structure
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      📝 Basic Registration: {basicFee} VNST
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      ⭐ Premium Registration: {premiumFee} VNST  
                    </Typography>
                    <Typography variant="body2">
                      🤖 AI Verification: {aiFee} vBTC
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Tab 2: AI Verification */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <SmartToy sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  AI-Powered Verification (Science Component)
                </Typography>
              </Box>
              
              {userArtworks.length > 0 ? (
                <Grid container spacing={3}>
                  {userArtworks.map((artwork, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Card sx={{ p: 3, backgroundColor: 'rgba(0, 212, 170, 0.1)', borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                          {artwork[1]} {/* title */}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          📁 {artwork[2].substring(0, 30)}... {/* ipfsHash */}
                        </Typography>
                        
                        {artwork[7] ? ( /* isAIVerified */
                          <Box>
                            <Chip 
                              label={`✅ AI Verified - Score: ${artwork[8]}/100`} /* aiConfidenceScore */
                              color="success" 
                              sx={{ mb: 2 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              Verification Hash: {artwork[9].substring(0, 20)}... {/* aiVerificationHash */}
                            </Typography>
                          </Box>
                        ) : (
                          <Button
                            variant="contained"
                            onClick={() => requestAIVerification(artwork.id)}
                            disabled={loading || parseFloat(vbtcBalance) < parseFloat(aiFee)}
                            sx={{ 
                              background: 'linear-gradient(45deg, #ff6b6b, #ff8e53)',
                              width: '100%'
                            }}
                          >
                            🤖 Request AI Verification ({aiFee} vBTC)
                          </Button>
                        )}
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: 'rgba(255, 107, 107, 0.1)' }}>
                  <Typography variant="h6" color="text.secondary">
                    No artworks registered yet. Register an artwork first to use AI verification.
                  </Typography>
                </Paper>
              )}
            </TabPanel>

            {/* Tab 3: Token Management */}
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <MonetizationOn sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  Token Management (Economics Component)
                </Typography>
              </Box>
              
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 4, backgroundColor: 'rgba(0, 212, 170, 0.1)', borderRadius: 3 }}>
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
                      🇻🇳 VNST Token
                    </Typography>
                    <Typography variant="h3" sx={{ mb: 2, color: 'primary.main' }}>
                      {parseFloat(vnstBalance).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Vietnam Stable Token for registration fees and licensing
                    </Typography>
                    <Button
                      onClick={() => getFreeTokens('VNST')}
                      disabled={loading}
                      variant="contained"
                      fullWidth
                      sx={{ background: 'linear-gradient(45deg, #00d4aa, #007b8a)' }}
                    >
                      Get Free VNST (10,000)
                    </Button>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 4, backgroundColor: 'rgba(255, 107, 107, 0.1)', borderRadius: 3 }}>
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
                      ₿ vBTC Token
                    </Typography>
                    <Typography variant="h3" sx={{ mb: 2, color: 'secondary.main' }}>
                      {parseFloat(vbtcBalance).toFixed(4)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Virtual Bitcoin for AI verification and premium features
                    </Typography>
                    <Button
                      onClick={() => getFreeTokens('vBTC')}
                      disabled={loading}
                      variant="contained"
                      fullWidth
                      sx={{ background: 'linear-gradient(45deg, #ff6b6b, #ff8e53)' }}
                    >
                      Get Free vBTC (0.1)
                    </Button>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Tab 4: Dashboard */}
            <TabPanel value={tabValue} index={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <TrendingUp sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  Marketplace Dashboard
                </Typography>
              </Box>
              
              <Grid container spacing={4}>
                <Grid item xs={12} md={3}>
                  <Card sx={{ p: 3, textAlign: 'center', backgroundColor: 'rgba(0, 212, 170, 0.1)' }}>
                    <Typography variant="h3" sx={{ color: 'primary.main', mb: 1 }}>
                      {marketStats.registrations}
                    </Typography>
                    <Typography variant="body1">Total Registrations</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card sx={{ p: 3, textAlign: 'center', backgroundColor: 'rgba(255, 107, 107, 0.1)' }}>
                    <Typography variant="h3" sx={{ color: 'secondary.main', mb: 1 }}>
                      {marketStats.licenses}
                    </Typography>
                    <Typography variant="body1">Licenses Sold</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card sx={{ p: 3, textAlign: 'center', backgroundColor: 'rgba(0, 212, 170, 0.1)' }}>
                    <Typography variant="h3" sx={{ color: 'primary.main', mb: 1 }}>
                      {parseFloat(marketStats.revenue).toFixed(0)}
                    </Typography>
                    <Typography variant="body1">Total Revenue (VNST)</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card sx={{ p: 3, textAlign: 'center', backgroundColor: 'rgba(255, 107, 107, 0.1)' }}>
                    <Typography variant="h3" sx={{ color: 'secondary.main', mb: 1 }}>
                      {parseFloat(creatorEarnings).toFixed(0)}
                    </Typography>
                    <Typography variant="body1">Your Earnings (VNST)</Typography>
                  </Card>
                </Grid>
              </Grid>

              {/* Recent Works */}
              {registeredWorks.length > 0 && (
                <Card sx={{ mt: 4, p: 3, backgroundColor: 'rgba(0, 212, 170, 0.1)' }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    📋 Recent Registrations
                  </Typography>
                  <List>
                    {registeredWorks.slice(0, 5).map((work, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                  {work.title}
                                </Typography>
                                <Chip 
                                  label={work.isPremium ? 'PREMIUM' : 'BASIC'} 
                                  size="small"
                                  color={work.isPremium ? 'secondary' : 'primary'}
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  💰 {work.vnstPaid} VNST • 🕒 {work.timestamp}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  TX: {work.txHash.substring(0, 20)}...
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < registeredWorks.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Card>
              )}

              {/* Contract Addresses */}
              <Card sx={{ mt: 4, p: 3, backgroundColor: 'rgba(0, 212, 170, 0.1)' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  📋 Contract Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>VNST Token:</strong>
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {vnstTokenAddress}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>vBTC Token:</strong>
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {vbtcTokenAddress}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>CopyrightChain:</strong>
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {copyrightChainAddress}
                    </Typography>
                  </Grid>
                </Grid>
              </Card>
            </TabPanel>
          </Card>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
