exports.handler = function(event, context, callback) {
  console.log("event ", event);
  const headers = {
    "Access-Control-Allow-Origin" : "*",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  const decodeBase64 = rawCode => {
    const base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-~";
    const answer = [];
    stringChars = rawCode.split('');
    stringChars.forEach(char => {
      var value = base64.indexOf(char);
      answer.push(value);
    });
    return answer;
  };
  
  const getTime = (arr, increment) => {
    const newArr = arr.map((column, index) => {
      const power =  arr.length - index - 1;
      const multiplier = index < arr.length ? Math.pow(increment, power) : column;
      return column * multiplier;
    })
    let totalSeconds = 0;
    newArr.forEach(segment => {
      totalSeconds+= segment;
    })
    return totalSeconds;
  };					
  
  const calculateAge = timeCode => {
    const nowEpoch = Math.floor(Date.now() / 1000);
    const ebayEpoch = 1073741818; // The Epoch time when Ebay time started: ~ 01/10/2004 @ 1:36pm (UTC)
    const itemTime = getTime(timeCode, 64); // The Ebay time when item's thumbnail image was uploaded
    const itemEpoch = ebayEpoch + itemTime; // The Epoch time when item's thumbnail image was uploaded
  
    const ageInSeconds = nowEpoch - itemEpoch;
    const ageInMinutes = ageInSeconds / 60;
    const ageInHours = ageInMinutes / 60;
    const ageInDays = ageInHours / 24;
  
    const age = {
      minutes: Math.floor(ageInMinutes),
      hours: Math.floor(ageInHours),
      days: Math.floor(ageInDays),
    }
    return age;
  };
  
  const netlifyDates = items => {
    const datedItems = {};
    Object.keys(items).forEach(item => {
      const imgUrl = items[item].imgUrl;
      const splitUrl = imgUrl.split('/');
      const beforeIndex = splitUrl.indexOf('g');
      const imageId = splitUrl.slice(beforeIndex+1, beforeIndex+2)[0];
      const base64Code = imageId.slice(imageId.length - 5, imageId.length);
      const timeCode = decodeBase64(base64Code);
      age = calculateAge(timeCode);
      datedItems[item] = age;
    });
    return datedItems;
  }

  const items = JSON.parse(event.body);
  if (event.httpMethod !== "POST") {
    callback(null, {
      statusCode: 200,
        headers,
        body: "This was not a POST request!"
    });
  }
  else if (Object.keys(items).length > 0) {
    const datedItems = netlifyDates(items);  
    callback(null, {
      statusCode: 200,
      headers,
      body: JSON.stringify({ datedItems }),
    });
  } else {
    callback(null, {
      statusCode: 424,
      headers,
      body: JSON.stringify({
        status: "failed",
        message: "Badness happened!"
      })
    });
  }
}

