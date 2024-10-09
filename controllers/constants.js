export const STAGED_AD_TO_DELAYED_LIMIT_IN_DAYS = 1

export const DEFAULT_SCHEDULE_TIME_DIFFERENCE_IN_HOUR = 1
export const IS_DIFFERENCE_MUST_BE_IN_HOUR = true

export const DEFAULT_SCHEDULE_TIME_DIFFERENCE_IN_MINUTES = 30
export const IS_DIFFERENCE_MUST_BE_IN_MINUTES = false

export const INDIVIDUAL_SAME_AD_LIMIT_PER_DAY = 1

export const ADMIN_ACCOUNT_INITIAL_BALANCE = 100

export const ACTION_TYPES = {
  "credit": "CREDIT",
  "debit": "DEBIT"
}

export const REACTION_TYPES = {
  LIKE: "LIKE",
  DISLIKE: "DISLIKE",
  CALL: "CALL",
  WEBSITE_URL: "WEBSITE_URL",
  CLICKED_RIGHT: "CLICKED_RIGHT",
  CLICKED_LEFT: "CLICKED_LEFT",
}

export const DEFAULT_ENGLISH_LANGUAGE_SHORT_NAME = "EN"

export const VIEW_INDICATORS = ["K", "M", "B"]

export const MESSAGE_STAT_FETCH_WINDOW_LENGTH_IN_DAYS = 7
export const LAST_POST_COUNT = 50

export const REQUIRED_CREATIVE_BUTTON_CONTENT = ["title", "link"]

export const REPORT_HTML_CONTENT = `
<html>
      <head>
        <style>
      table {
          font-family: Arial, Helvetica, sans-serif;
          border-collapse: collapse;
          width: 100%;
          background-color: red;
        }
        
        table td, table th {
          border: 1px solid #ddd;
          padding: 8px;
          background-color: red;
        }
        
        table tr:nth-child(even){background-color: #f2f2f2;}
        
        table tr:hover {background-color: #ddd;}
        
       th {
          padding-top: 12px;
          padding-bottom: 12px;
          text-align: left;
          background-color: #04AA6D;
          color: white;
        }

        #title{
          float: left;
        }
        #channel{
          float: right;
        }
        </style>
      </head>
      <body>
        {CONTENT}
      </body>
    </html>
`

export const REPORT_HTML_CONTENT_FOR_CHANNEL = `
  <table>
        <thead>
          <tr>
            <th></th>
            <th>Creative</th>
            <th>Posted At</th>
            <th>View</th>
            <th>Payment</th>
          </tr>
        </thead>
        <tbody>
          <!-- Add your table rows here -->
          <!--
          <tr class="table-row"
            data-payment="$500">
            <td>1</td>
            <td>AiQEM Ad NEW</td>
            <td>Dec 14- 2023</td>
            <td>1000</td>
            <td>21.296 Birr</td>
          </tr>
          -->
          ROW_DATA
          <!-- Add more rows as needed -->
        </tbody>
        <tfoot>
          <!-- Total Row -->
          <tr id="total-row">
            <td colspan="4" style="text-align: right;">Total:</td>
            <td> TOTAL_AMOUNT </td> <!-- You can replace this with the actual total amount -->
          </tr>
        </tfoot>
      </table>
`
export const TABLE_ROW = `<tr class="table-row">
ROW
</tr>
`
export const TABLE_ROW_CONTENT_DATA = `<td> DATA </td>`


export const CAMPAIGN_REPORT_CAPTION = 'Please find your 💸 income and payment 💸 report for the campaign: <strong> CAMPAIGN </strong>'


export const CHANNEL_REPORT_HTML_CONTENT_FOR_CAMPAIGN = `
<hr>
    <div id="report-info" style="">
      <p><strong>Channel:</strong> CHANNEL_NAME </p>
      <p><strong>Type:</strong> CHANNEL_TYPE </p>
      <p><strong>Payment:</strong> CHANNEL_PAYMENT </p>
    </div>
    <!-- Table Section -->
    <div id="table-container">
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Creative</th>
            <th>Posted At</th>
            <th>View</th>
            <th>Payment</th>
          </tr>
        </thead>
        <tbody>
          <!-- Add your table rows here -->
          <!--
          <tr class="table-row">
            <td>1</td>
            <td>AiQEM Ad NEW</td>
            <td>Dec 14- 2023</td>
            <td>1000</td>
            <td>21.296 Birr</td>
          </tr>
          -->

          ROW_DATA
          <!-- Add more rows as needed -->
        </tbody>
        <tfoot>
          <!-- Total Row -->
          <tr id="total-row">
            <td colspan="4" style="text-align: right;">Total:</td>
            <td> TOTAL_AMOUNT </td> <!-- You can replace this with the actual total amount -->
          </tr>
        </tfoot>
      </table>
    </div>
`


