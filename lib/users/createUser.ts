import { Wallet } from 'ethers';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { getENSName } from 'lib/blockchain/getENSName';
import type { SignupAnalytics } from 'lib/metrics/mixpanel/interfaces/UserEvent';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackUserProfile } from 'lib/metrics/mixpanel/updateTrackUserProfile';
import { isProfilePathAvailable } from 'lib/profile/isProfilePathAvailable';
import { sessionUserRelations } from 'lib/session/config';
import { shortenHex, shortWalletAddress } from 'lib/utilities/strings';
import type { LoggedInUser } from 'models';

import { getUserProfile } from './getUser';

export async function createUserFromWallet(
  { id = v4(), address = Wallet.createRandom().address, email }: { address?: string; email?: string; id?: string } = {},
  signupAnalytics: Partial<SignupAnalytics> = {}
): Promise<LoggedInUser> {
  const lowercaseAddress = address.toLowerCase();

  try {
    const user = await getUserProfile('addresses', lowercaseAddress);
    return user;
  } catch (error) {
    const ens: string | null = await getENSName(address);
    const userPath = shortWalletAddress(address).replace('…', '-');
    const isUserPathAvailable = await isProfilePathAvailable(userPath);

    const newUser = await prisma.user.create({
      data: {
        email,
        id,
        identityType: 'Wallet',
        username: ens ?? address.toLowerCase(),
        path: isUserPathAvailable ? userPath : null,
        wallets: {
          create: {
            address: lowercaseAddress,
            ensname: ens
          }
        }
      },
      include: sessionUserRelations
    });

    updateTrackUserProfile(newUser, prisma);
    trackUserAction('sign_up', { userId: newUser.id, identityType: 'Wallet', ...signupAnalytics });

    return newUser;
  }
}
