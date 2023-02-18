import React, { useEffect } from 'react';
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import { ethers } from 'ethers';
import contractABI from './utils/contractABI.json';
import {networks} from './utils/networks';
import polygonLogo from './assets/polygonlogo.png';
import ethLogo 	from './assets/ethlogo.png';
// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const tld = '.ninja';
const CONTRACT_ADDRESS = "0x798953b090289Ebde16F7f2988f4819adfd46F78";

const App = () => {

	const [currentAccount, setCurrentAccount] = React.useState("");
	const [domain,setDomain] = React.useState("");
	const [editing,setEditing] = React.useState(false);
	const [loading,setLoading] = React.useState(false);
	const [record,setRecord] = React.useState("");
	const [mints,setMints] = React.useState([]);
	const [network,setNetwork] = React.useState("");

	const checkIfWalletIsConnected  =  async  () => {
		const {ethereum} = window;

		if(!ethereum){
			console.log("Make sure you have MetaMask!");
			return;
		}else{
			console.log("We have the ethereum object",ethereum);
		}

		const accounts = await ethereum.request({ method: 'eth_accounts'});

		if(accounts!==0){
			const account = accounts[0];
			console.log("Found an authorized account:", account);
			setCurrentAccount(account);
		} else {
			console.log("No authorized account found");
		}

		const chainId = await ethereum.request({method: 'eth_chainId'});
		setNetwork(networks[chainId]);

		ethereum.on('chainChanged',handleChainChanged);

		function handleChainChanged(_chainId){
			setNetwork(networks[_chainId]);
		}
	};

	const updateDomain = async() =>{
		if(!record || !domain) {return}
		setLoading(true);
		console.log("Updating domain",domain,"with record",record);
		try{
			const {ethereum} = window;

			if(ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, signer);

				let txn = await contract.setRecord(domain,record);
				await txn.wait();

				console.log("Record set! https://mumbai.polygonscan.com/tx/",txn.hash);
				
				setTimeout(() => {
					fetchMints();
				}, 2000);
				setRecord("");
				setDomain("");
			}
		}catch (error){
			console.log(error);
		}
		setLoading(false);
	}

	const mintDomain = async() => {
		if(!domain) {return}

		if(domain.length<3){
			alert("Domain too short");
			return;
		}

		const price = domain.length === 3 ? '0.05' : domain.length === 4 ? '0.03' : '0.01';
		console.log("Minting domain",domain,"with price",price);

		try{
			const {ethereum} = window;

			if(ethereum){
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, signer);

				let txn = await contract.register(domain,{value: ethers.utils.parseEther(price)});

				const receipt = await txn.wait();

				if(receipt.status === 1){
					console.log("Domain minted! https://mumbai.polygonscan.com/tx/",txn.hash);

					txn = await contract.setRecord(domain,record);
					await txn.wait();

					console.log("Record set! https://mumbai.polygonscan.com/tx/",txn.hash);


					setTimeout(() => {
						fetchMints();
					}, 2000);
					setDomain("");
					setRecord("");
				}
			} else {
				console.log("Transaction failed");
			}

		}catch(error){
			console.log(error);
		}
	}

	const renderMints = () => {
		if (currentAccount && mints.length > 0) {
		  return (
			<div className="mint-container">
			  <p className="subtitle"> Recently minted domains!</p>
			  <div className="mint-list">
				{ mints.map((mint, index) => {
				  return (
					<div className="mint-item" key={index}>
					  <div className='mint-row'>
						<a className="link" href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`} target="_blank" rel="noopener noreferrer">
						  <p className="underlined">{' '}{mint.name}{tld}{' '}</p>
						</a>
						{/* If mint.owner is currentAccount, add an "edit" button*/}
						{ mint.owner.toLowerCase() === currentAccount.toLowerCase() ?
						  <button className="edit-button" onClick={() => editRecord(mint.name)}>
							<img className="edit-icon" src="https://img.icons8.com/metro/26/000000/pencil.png" alt="Edit button" />
						  </button>
						  :
						  null
						}
					  </div>
				<p> {mint.record} </p>
			  </div>)
			  })}
			</div>
		  </div>);
		}
	  };

	const editRecord = (name) => {
		console.log("Editing record for",name);
		setDomain(name);
		setEditing(true);
	}

	const connectWallet = async () => {
		try {
			const {ethereum} = window;

			if(!ethereum){
				alert("Get MetaMask!");
				return;
			}

			const accounts = await ethereum.request({ method: 'eth_requestAccounts'});
			console.log("Connected", accounts[0]);
			setCurrentAccount(accounts[0]);
		} catch (error) {
			console.log(error);
		}
	};


	const renderNotConnectedContainer = () => (
		<div className="connect-wallet-container">
			<img src="https://media.giphy.com/media/3ohhwytHcusSCXXOUg/giphy.gif" alt="metamask-logo" />
			<button className="cta-button connect-wallet-button" onClick={connectWallet}>
				Connect Wallet
			</button>
		</div>
	)

	const fetchMints = async() => {
		try{
			const {ethereum} = window;

			if(ethereum){
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, signer);

				const names = await contract.getAllNames();
				
				const mintRecords = await Promise.all(names.map(async (name) => {
					const mintRecord = await contract.records(name);
					const owner = await contract.domains(name);
					return {
						id : names.indexOf(name),
						name: name,
						record: mintRecord,
						owner: owner
					}
				}))

				console.log("Mints: ", mintRecords);
				setMints(mintRecords);
			}
		} catch (error){
			console.log(error);
		}
	}

	const switchNetwork = async()=>{
		if(window.ethereum) {
			try{
				await window.ethereum.request({
					method: 'wallet_switchEthereumChain',
					params: [{ chainId: '0x13881' }],
				})
			} catch(error){
				if(error === 4902) {
					try{
						await window.ethereum.request ({
							method: 'wallet_addEthereumChain',
							params: [
								{
									chainId: '0x13881',
									chainName: 'Polygon Mumbai Testnet',
									rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
									nativeCurrency: {
										name: 'Mumbai MATIC',
										symbol: 'MATIC',
										decimals: 18
									},
									blockExplorerUrls: ['https://mumbai.polygonscan.com/']
								},
							],
						});
					}catch(error){
						console.log(error);
					}
				}console.log(error);
			}
		}else {
			alert("Get MetaMask!");
		}
	}

	const renderInputForm = () => {

		if(network !== "Polygon Mumbai Testnet"){
			return (
				<div className="connect-wallet-container">
				<p> Please connect to the Polygon Mumbai Testnet</p>
				</div>
			);
		}
		return(
			<div className= "form-container">
				<div className="first-row">
					<input type="text" placeholder="Enter Domain" value={domain} onChange={(e) => setDomain(e.target.value)} />
					<p className='tld'>{tld}</p>
				</div>

				<input
					type="text"
					value={record}
					placeholder="whats ur ninja power"
					onChange={(e) => setRecord(e.target.value)}
				/>
				{editing  ? (
					<div className="button-container">
					<button className='cta-button mint-button' onClick={updateDomain} disabled={loading}>
					Set record
					</button>
					<button className='cta-button mint-button' onClick={()=>{setEditing(false)}}>
						Cancel
					</button>;
					</div>
				): (
					<button className='cta-button mint-button' disabled={loading} onClick={mintDomain}>
              Mint
            </button>
				)}
{/* 
				<div className='button-container'>
					<button className='cta-button mint-button' onClick={mintDomain} >
						Mint
					</button>
					<button className='cta-button mint-button' onClick={null} disabled={null}>
						Set data
					</button>
				</div> */}
			</div>
		);
	}

	useEffect(() => {
		checkIfWalletIsConnected();
		}, []);

	useEffect(() => {
		if (network == "Polygon Mumbai Testnet") {
			fetchMints();
		}
	}, [currentAccount,network]);

  return (
		<div className="App">
			<div className="container">

				<div className="header-container">
					<header>
            <div className="left">
              <p className="title">🐱‍👤 Ninja Name Service</p>
              <p className="subtitle">Your immortal API on the blockchain!</p>
            </div>
			<div className='right'>
			<img alt="Network logo" className="logo" src={network.includes('Polygon') ? polygonLogo : ethLogo} />
			{currentAccount ? <p> Wallet : {currentAccount.slice(0,6)}...{currentAccount.slice(-4)}</p> : <p> Not Connected</p>}
			</div>
					</header>
				</div>

				{!currentAccount && renderNotConnectedContainer()}

				{currentAccount && renderInputForm()}

				{mints && renderMints()}

        <div className="footer-container">
					<img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
					<a
						className="footer-text"
						href={TWITTER_LINK}
						target="_blank"
						rel="noreferrer"
					>
					{/* {`built with @${TWITTER_HANDLE}`} */}
					</a>
				</div>
			</div>
		</div>
	);
}

export default App;
