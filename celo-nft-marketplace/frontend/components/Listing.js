import { formatEther } from "ethers/lib/utils";
import { useEffect, useState } from "react";
import { useAccount, useContract, useProvider } from "wagmi";
import ERC721ABI from "../abis/ERC721.json";
import styles from "../styles/Listing.module.css";

export default function Listing(props) {
  // State variables to hold information about the NFT
  const [imageURI, setImageURI] = useState("");
  const [name, setName] = useState("");

  // Loading state
  const [loading, setLoading] = useState(true);

  // Get the provider, connected address, and a contract instance
  // for the NFT contract using wagmi
  const provider = useProvider();
  const { address, isConnected } = useAccount();
  const ERC721Contract = useContract({
    addressOrName: props.nftAddress,
    contractInterface: ERC721ABI,
    signerOrProvider: provider,
  });

  // Check if the NFT seller is the connected user
  const isOwner = address.toLowerCase() === props.seller.toLowerCase();

  // Fetch NFT details by resolving the token URI
  async function fetchNFTDetails() {
    try {
      // Get token URI from contract
      let tokenURI = await ERC721Contract.tokenURI(0);
      // If it's an IPFS URI, replace it with an HTTP Gateway link
      tokenURI = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");

      // Resolve the Token URI
      const metadata = await fetch(tokenURI);
      const metadataJSON = await metadata.json();

      // Extract image URI from the metadata
      let image = metadataJSON.imageUrl;
      // If it's an IPFS URI, replace it with an HTTP Gateway link
      image = image.replace("ipfs://", "https://ipfs.io/ipfs/");

      // Update state variables
      setName(metadataJSON.name);
      setImageURI(image);
      setLoading(false);
    } catch (error) {}
  }

  // Fetch the NFT details when component is loaded
  useEffect(() => {
    if (isConnected && address) {
      fetchNFTDetails();
    }
  }, [isConnected]);

  if (!isConnected) return null;

  return (
    <div>
      {loading ? (
        <span>Loading</span>
      ) : (
        <div className={styles.card}>
          <img src={imageURI} />
          <div className={styles.container}>
            <span>
              <b>
                {name} - #{props.tokenId}
              </b>
            </span>
            <span>Price: {formatEther(props.price)} CELO</span>
            <span>
              Seller: {isOwner ? "You" : props.seller.substring(0, 6) + "..."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
