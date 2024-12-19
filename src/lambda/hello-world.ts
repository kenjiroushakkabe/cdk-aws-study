import { APIGatewayProxyResultV2, APIGatewayProxyEventV2, Context } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEventV2, context: Context): Promise<APIGatewayProxyResultV2> => {
  console.log('Hello world');
  console.log('event', event);
  console.log('context', context);

  throw new Error('this is an error');
  // return {
  //   statusCode: 200,
  //   body: JSON.stringify('Hello, world'),
  // };
};
