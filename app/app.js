const express = require('express');
const app = express();
//hi
app.get('/', (req, res) => {
  res.send('🚀 CI/CD App is Running!');
});
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
