const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('🚀 CI/CD App is Running!');
});
//hi
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
