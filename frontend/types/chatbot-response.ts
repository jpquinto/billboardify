export type ChatbotResponse =
  | {
      success?: true; // Optional, defaults to true for successful responses
      response: string;
      tool_data: {
        tool_query_listening_data?: {
          sql: string;
          response: string;
          data: any[];
        };
      };
    }
  | {
      success: false;
      error: string;
      statusCode?: number; // Made optional since timeout errors don't have statusCode
    };
