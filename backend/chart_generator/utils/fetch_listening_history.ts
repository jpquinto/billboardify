import { unmarshall } from "@aws-sdk/util-dynamodb";
import {
  DynamoDBClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/client-dynamodb";
import { ListeningHistoryDynamoDBItem } from "chart_generator/types";

const { LISTENING_HISTORY_TABLE_NAME } = process.env;
const DYNAMODB_CLIENT = new DynamoDBClient({});

export const fetchListeningHistory = async (
  cutoffTimestamp: string
): Promise<ListeningHistoryDynamoDBItem[]> => {
  console.log(`Fetching listening history since: ${cutoffTimestamp}`);
  let allItems: ListeningHistoryDynamoDBItem[] = [];
  let lastEvaluatedKey;

  do {
    const params: QueryCommandInput = {
      TableName: LISTENING_HISTORY_TABLE_NAME,
      KeyConditionExpression: "user_id = :user_id AND #ts > :timestamp",
      ExpressionAttributeNames: {
        "#ts": "timestamp",
      },
      ExpressionAttributeValues: {
        ":user_id": { S: "me" },
        ":timestamp": { S: cutoffTimestamp },
      },
      ExclusiveStartKey: lastEvaluatedKey,
    };

    const command = new QueryCommand(params);
    const response = await DYNAMODB_CLIENT.send(command);

    if (response.Items) {
      const items = response.Items.map((item) =>
        unmarshall(item)
      ) as ListeningHistoryDynamoDBItem[];
      allItems = allItems.concat(items);
    }

    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`Found ${allItems.length} new listening history items.`);
  return allItems;
};
