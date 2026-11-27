import { MultiProtocolProvider } from '@hyperlane-xyz/sdk';
import { getWagmiChainConfigs } from '@hyperlane-xyz/widgets';
import { RainbowKitProvider, connectorsForWallets, lightTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import {
  argentWallet,
  binanceWallet,
  coinbaseWallet,
  injectedWallet,
  ledgerWallet,
  metaMaskWallet,
  rainbowWallet,
  trustWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { PropsWithChildren, useMemo } from 'react';
import { createClient, fallback, http } from 'viem';
import { base, optimism } from 'viem/chains';
import { WagmiProvider, createConfig } from 'wagmi';
import { APP_NAME } from '../../../consts/app';
import { config } from '../../../consts/config';
import { Color } from '../../../styles/Color';
import { useMultiProvider } from '../../chains/hooks';

function initWagmi(multiProvider: MultiProtocolProvider) {
  const appChains = getWagmiChainConfigs(multiProvider);
  // Wallets use their own connections, often outside the bridge origin.
  const chains = appChains.map((chain) => {
    const walletChain =
      chain.id === base.id ? base : chain.id === optimism.id ? optimism : undefined;
    return walletChain ? { ...chain, rpcUrls: walletChain.rpcUrls } : chain;
  });

  const connectors = connectorsForWallets(
    [
      {
        groupName: 'Recommended',
        wallets: [metaMaskWallet, injectedWallet, walletConnectWallet, ledgerWallet],
      },
      {
        groupName: 'More',
        wallets: [binanceWallet, coinbaseWallet, rainbowWallet, trustWallet, argentWallet],
      },
    ],
    { appName: APP_NAME, projectId: config.walletConnectProjectId },
  );

  const wagmiConfig = createConfig({
    chains: [chains[0], ...chains.slice(1)],
    connectors,
    client({ chain }) {
      const appChain = appChains.find((item) => item.id === chain.id) || chain;
      const transport = fallback(appChain.rpcUrls.default.http.map((chainHttp) => http(chainHttp)));
      return createClient({ chain, transport });
    },
  });

  return { wagmiConfig, chains };
}

export function EvmWalletContext({ children }: PropsWithChildren<unknown>) {
  const multiProvider = useMultiProvider();
  const { wagmiConfig } = useMemo(() => initWagmi(multiProvider), [multiProvider]);

  return (
    <WagmiProvider config={wagmiConfig}>
      <RainbowKitProvider
        theme={lightTheme({
          accentColor: Color.primary['500'],
          borderRadius: 'small',
          fontStack: 'system',
        })}
      >
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
