import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import styles from "../styles/Navbar.module.css";

export default function Navbar() {
  return (
    <div className={styles.navbar}>
      <Link href="/">Home</Link>
      <Link href="/create">Create Listing</Link>

      <ConnectButton />
    </div>
  );
}
