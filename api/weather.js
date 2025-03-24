// api/weather.js
module.exports = async (req, res) => {
    const { city, lat, lon } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    let url;
    if (city) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    } else if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    } else {
      res.status(400).json({ error: 'Missing city or coordinates' });
      return;
    }
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  };