export const mobileCatalogPaths = {
  '/api/mobile/product/{id}': {
    get: {
      summary: 'Get product details for customer',
      description: 'Fetch detailed specifications of a retailer product listing along with active retailer profile and alternative competitor offers for the same product model.',
      tags: ['Mobile Catalog'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'The unique ID of the retailer-listed product (must be isMasterTemplate: false)',
          schema: {
            type: 'string',
          },
        },
      ],
      responses: {
        200: {
          description: 'Successful product details resolution',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  product: {
                    type: 'object',
                    description: 'The complete product object details',
                  },
                  retailer: {
                    type: 'object',
                    nullable: true,
                    properties: {
                      shopName: { type: 'string' },
                      city: { type: 'string' },
                      landmark: { type: 'string', nullable: true },
                      businessHours: {
                        type: 'object',
                        properties: {
                          startTime: { type: 'string' },
                          endTime: { type: 'string' },
                          openEveryday: { type: 'boolean' },
                        },
                      },
                      averageRating: { type: 'number' },
                      ratingCount: { type: 'number' },

                    },
                  },
                  otherOffers: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        productId: { type: 'string' },
                        price: { type: 'number' },
                        discountedPrice: { type: 'number', nullable: true },
                        shopName: { type: 'string' },
                        city: { type: 'string' },
                        averageRating: { type: 'number' },
                        ratingCount: { type: 'number' },

                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Invalid product ID supplied',
        },
        404: {
          description: 'Product not found or represents a master catalog template',
        },
      },
    },
  },
}
