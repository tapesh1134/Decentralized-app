import React, { useState, useEffect } from 'react';
import detectEthereumProvider from '@metamask/detect-provider';
import Web3 from 'web3';
import './App.css'; // Import CSS file

// Import your ERC20 token ABI here
import tokenABI from './ABI.json';

function App() {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [balance, setBalance] = useState('0');
  const [totalSupply, setTotalSupply] = useState('0');
  const [tokenName, setTokenName] = useState('');
  const [decimals, setDecimals] = useState('0');
  const [tokenContract, setTokenContract] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  // Define token contract address
  const tokenContractAddress = '0x3191B9dcE26F60074270033c8BE81E515C1e3A4E';

  // Function to fetch token details before connecting to MetaMask
  const fetchTokenDetails = async () => {
    try {
      const provider = await detectEthereumProvider();
      const web3Instance = new Web3(provider);
      const contract = new web3Instance.eth.Contract(tokenABI, tokenContractAddress);

      const tokenName = await contract.methods.name().call();
      const totalSupply = await contract.methods.totalSupply().call();
      const decimals = await contract.methods.decimals().call();

      setTokenName(tokenName);
      setTotalSupply(totalSupply);
      setDecimals(decimals);
    } catch (error) {
      console.error('Error fetching token details:', error);
    }
  };

  // Initial fetch of token details
  useEffect(() => {
    fetchTokenDetails();
  }, []);

  useEffect(() => {
    const init = async () => {
      // Detect MetaMask provider
      const provider = await detectEthereumProvider();

      if (provider) {
        const web3Instance = new Web3(provider);
        setWeb3(web3Instance);

        // Request access to MetaMask account
        try {
          await provider.request({ method: 'eth_requestAccounts' });
        } catch (error) {
          console.error('User rejected MetaMask access');
        }
      } else {
        console.error('MetaMask not detected');
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (web3) {
      // Get current accounts
      web3.eth.getAccounts()
        .then(accounts => setAccounts(accounts))
        .catch(console.error);
    }
  }, [web3]);

  useEffect(() => {
    if (web3 && accounts.length > 0) {
      // Initialize token contract
      const contract = new web3.eth.Contract(tokenABI, tokenContractAddress);
      setTokenContract(contract);

      // Fetch token details
      contract.methods.totalSupply().call()
        .then(totalSupply => setTotalSupply(totalSupply))
        .catch(console.error);

      contract.methods.name().call()
        .then(name => setTokenName(name))
        .catch(console.error);

      contract.methods.decimals().call()
        .then(decimals => setDecimals(decimals))
        .catch(console.error);

      // Get token balance
      contract.methods.balanceOf(accounts[0]).call()
        .then(balance => setBalance(balance))
        .catch(console.error);
    }
  }, [web3, accounts]);

  const handleMint = async () => {
    // Mint new tokens
    const amount = '1000000000000000000'; // 1 token in wei
    await tokenContract.methods.mint(accounts[0], amount).send({ from: accounts[0] });
    // Refresh balance
    const newBalance = await tokenContract.methods.balanceOf(accounts[0]).call();
    setBalance(newBalance);
  };

  const handleBurn = async () => {
    // Predefined amount to burn (e.g., 1 token in wei)
    const amountToBurn = '1000000000000000000'; // 1 token in wei

    try {
      // Burn tokens
      console.log('Burning tokens...');
      const receipt = await tokenContract.methods.burn(amountToBurn).send({ from: accounts[0] });
      console.log('Burn transaction receipt:', receipt);

      // Refresh balance
      const newBalance = await tokenContract.methods.balanceOf(accounts[0]).call();
      setBalance(newBalance);
    } catch (error) {
      console.error('Error burning tokens:', error);
    }
  };

  const handlePause = async () => {
    // Pause token contract
    await tokenContract.methods.pause().send({ from: accounts[0] });
    // You may want to update UI or handle confirmation here
  };

  const handleUnpause = async () => {
    // Unpause token contract
    await tokenContract.methods.unpause().send({ from: accounts[0] });
    // You may want to update UI or handle confirmation here
  };

  const handleTransfer = async () => {
    // Multiply amount by 10^18
    const amountInWei = web3.utils.toWei(amount.toString(), 'ether');

    // Transfer tokens
    await tokenContract.methods.transfer(recipient, amountInWei).send({ from: accounts[0] });

    // Refresh balance
    const newBalance = await tokenContract.methods.balanceOf(accounts[0]).call();
    setBalance(newBalance);
    setRecipient('');
    setAmount('');
};


const handleApprove = async () => {
  try {
      // Multiply amount by 10^18
      const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
      
      // Approve tokens
      await tokenContract.methods.approve(recipient, amountInWei).send({ from: accounts[0] });
      
      // You may want to update UI or handle confirmation here
  } catch (error) {
      console.error('Error approving tokens:', error);
  }
};


  const handleMultisend = async (recipients, amounts) => {
    try {
        if (recipients.length !== amounts.length) {
            console.error('Number of recipients and amounts should match.');
            return;
        }

        // Iterate through each recipient and amount pair
        for (let i = 0; i < recipients.length; i++) {
            // Multiply amount by 10^18
            const amountInWei = web3.utils.toWei(amounts[i].toString(), 'ether');
            
            // Send tokens to each recipient
            await tokenContract.methods.transfer(recipients[i], amountInWei).send({ from: accounts[0] });
        }

        // Refresh balance
        const newBalance = await tokenContract.methods.balanceOf(accounts[0]).call();
        setBalance(newBalance);
    } catch (error) {
        console.error('Error sending tokens:', error);
    }
};


  return (
    <div>
      <div id="tokenWebsite">
        <h1>ERC20 Token Website</h1>
        <p>Token Name: <span id="tokenName">{tokenName}</span></p>
        <p>Connected Account: <span id="connectedAccount">{accounts.length > 0 ? accounts[0] : 'Not connected'}</span></p>
        <p>Token Balance: <span id="tokenBalance">{web3 && balance && web3.utils.fromWei(balance, 'ether')}</span></p>
        <p>Total Supply: <span id="totalSupply">{web3 && totalSupply && web3.utils.fromWei(totalSupply, 'ether')}</span></p>
        <p>Decimals: 18<span id="decimals">{decimals}</span></p>
      </div>

      <div id='tokenOperations'>
        <h3>Mint Tokens</h3>
        <button className="button" onClick={handleMint}>Mint Tokens</button>
        <h3>Burn Tokens</h3>
        <button className="button" onClick={handleBurn}>Burn Tokens</button>
        <h3>Pause/Unpause</h3>
        <button className="button" onClick={handlePause}>Pause</button>
        <button className="button" onClick={handleUnpause}>Unpause</button>
        <h3>Transfer Tokens</h3>
        <input
          type="text"
          placeholder="Recipient Address"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
        <input
          type="text"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button className="button" onClick={handleTransfer}>Transfer</button>

        <h3>Approve Tokens</h3>
        <input
          type="text"
          placeholder="Spender Address"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
        <input
          type="text"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button className="button" onClick={handleApprove}>Approve</button>
        <div id='tokenOperations'>
          <h3>Multi-send Tokens</h3>
          <p>Recipient Addresses: </p>
          <input
            type="text"
            placeholder="Recipient Addresses (comma-separated)"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          <p>Amounts: </p>
          <input
            type="text"
            placeholder="Amounts (comma-separated)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button className="button" onClick={() => {
            const recipientsArray = recipient.split(',').map(addr => addr.trim());
            const amountsArray = amount.split(',').map(amt => amt.trim());
            handleMultisend(recipientsArray, amountsArray);
          }}>Multi-send Tokens</button>
        </div>

      </div>
    </div>
  );
}

export default App;