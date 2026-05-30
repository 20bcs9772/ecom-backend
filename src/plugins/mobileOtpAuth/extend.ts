import type { Config, CollectionSlug } from 'payload'
import { mobileAuthFields } from './fields'
import { roleOptionsToEnsure } from './constants'

export const extendUsersCollection = (config: Config, usersSlug: string): Config => {
  return {
    ...config,
    collections: (config.collections || []).map((collection) => {
      if (collection.slug !== usersSlug) {
        return collection
      }

      const existingFieldNames = new Set(
        collection.fields.flatMap((field) => ('name' in field ? [field.name] : [])),
      )

      const fieldsToAdd = mobileAuthFields.filter((field) => {
        return 'name' in field && !existingFieldNames.has(field.name)
      })

      return {
        ...collection,
        admin: {
          ...collection.admin,
          defaultColumns: Array.from(
            new Set([...(collection.admin?.defaultColumns || []), 'mobileNumber']),
          ),
        },
        fields: [
          ...collection.fields.map((field) => {
            if ('name' in field && field.name === 'roles' && field.type === 'select') {
              const existingOptions = new Set(
                field.options.map((option) => (typeof option === 'string' ? option : option.value)),
              )

              return {
                ...field,
                options: [
                  ...field.options,
                  ...roleOptionsToEnsure.filter((option) => !existingOptions.has(option.value)),
                ],
              }
            }

            return field
          }),
          ...fieldsToAdd,
        ],
      }
    }),
  }
}
