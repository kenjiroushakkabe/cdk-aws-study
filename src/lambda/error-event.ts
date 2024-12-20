import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SNSHandler } from 'aws-lambda';

const snsClient = new SNSClient({ region: process.env.AWS_REGION });

export const handler: SNSHandler = async (event: any) => {
  for (const record of event.Records) {
    const message = JSON.parse(record.Sns.Message);
    console.log('Received SNS message:', message);

    const simplifiedMessage = `
      Alarm Name: ${message.AlarmName}
      New State: ${message.NewStateValue}
      Reason: ${message.NewStateReason}
    `;

    console.log('Simplified message:', simplifiedMessage);

    const emailTopicArn = process.env.EMAIL_TOPIC_ARN;
    if (emailTopicArn) {
      try {
        const command = new PublishCommand({
          Message: simplifiedMessage,
          TopicArn: emailTopicArn,
        });
        await snsClient.send(command);
        console.log('Message sent successfully');
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    } else {
      console.error('EMAIL_TOPIC_ARN is not set');
    }
  }
};