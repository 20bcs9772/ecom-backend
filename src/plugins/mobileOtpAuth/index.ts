import type { Plugin } from 'payload'
import type { MobileOtpAuthPluginOptions } from './types'
import { extendUsersCollection } from './extend'
import { requestOtpEndpoint, verifyOtpEndpoint, meEndpoint } from './endpoints'

export const mobileOtpAuthPlugin =
  ({ enabled = true, usersSlug = 'users' }: MobileOtpAuthPluginOptions = {}): Plugin =>
  (config) => {
    if (!enabled) {
      return config
    }

    const configWithUsers = extendUsersCollection(config, usersSlug)

    return {
      ...configWithUsers,
      endpoints: [
        ...(configWithUsers.endpoints || []),
        requestOtpEndpoint(usersSlug),
        verifyOtpEndpoint(usersSlug),
        meEndpoint(),
      ],
    }
  }

export { mobileOtpAuthPaths } from './openapi'

