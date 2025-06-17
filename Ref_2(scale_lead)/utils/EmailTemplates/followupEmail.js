export const followupHtml = (subject, message) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f8f9fa;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
            text-align: left;
          }
          h2 {
            color: #2c3e50;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            color: #555555;
            font-size: 16px;
            line-height: 1.6;
          }
          .cta-button {
            display: inline-block;
            margin-top: 25px;
            padding: 12px 24px;
            background-color: #007bff;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            transition: background-color 0.3s ease;
          }
          .cta-button:hover {
            background-color: #0056b3;
          }
          .footer {
            margin-top: 35px;
            font-size: 14px;
            color: #aaaaaa;
            text-align: center;
            border-top: 1px solid #eee;
            padding-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>${subject}</h2>
          <p>${message}</p>

         

          <p class="footer">
            If you’re not interested, no worries — we appreciate your time!
          </p>
        </div>
      </body>
    </html>
  `;
};
