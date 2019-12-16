exports.handler = function(event, context, callback) {
  const headers = {
    "Access-Control-Allow-Origin" : "*",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  const decodeBase64 = rawCode => {
    // rawCode = civ3e
    const ebayBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-~";
    const answer = [];
    stringChars = rawCode.split(''); // ["c", "i", "v", "3", "e"]
    stringChars.forEach(char => {
      var value = ebayBase64.indexOf(char); // 28, 34, 47, 55, 30
      answer.push(value);
    });
    return answer; // [28, 34, 47, 55, 30]
  };
  
  const getTime = (arr) => {
    // arr = [28, 34, 47, 55, 30]
    const newArr = arr.map((column, index) => {
      // column = 28, 34, 47, 55, 30
      const power = arr.length - index - 1; 
      // power = 4, 3, 2, 1, 0
      const multiplier = index < arr.length ? Math.pow(64, power) : column;
      // multiplier = 16777216, 262144, 4096, 64, 1
      return column * multiplier;
    })
    // newArr = [469762048, 8912896, 192512, 3520, 30];
    let totalSeconds = 0;
    newArr.forEach(segment => {
      totalSeconds+= segment;
    })
    return totalSeconds; // 478,871,006

    // Note: actual Base64 encoding would turn 478871006 into "NDc4ODcxMDA2"
    // By using a base 64 numeral system, eBay can reduce that same number to just "civ3e"
  };					
  
  const calculateAge = timeCode => {
    const nowEpoch = Math.floor(Date.now() / 1000); // 1,572,580,928 (11/01/2019)
    const ebayEpoch = 1073741818; // The epoch time (seconds from 01/01/1970) when Ebay time began: ~ 01/10/2004 @ 1:36pm (UTC)
    const itemTime = getTime(timeCode); // The Ebay time when item's thumbnail image was uploaded: 478,871,006 seconds from 01/10/2004
    const itemEpoch = ebayEpoch + itemTime; // 1,073,741,818 + 478,871,006 = 1,552,612,824

    const ageInSeconds = nowEpoch - itemEpoch; // 1,572,580,928 - 1,552,612,824 = 19,968,104 seconds
    const ageInMinutes = ageInSeconds / 60; // 332,801 minutes
    const ageInHours = ageInMinutes / 60; // 5546 hours
    const ageInDays = ageInHours / 24; // 92 days
  
    const age = {
      minutes: Math.floor(ageInMinutes),
      hours: Math.floor(ageInHours),
      days: Math.floor(ageInDays),
    }
    return age;
  };
  
  const translateDateCodes = items => {
    const datedItems = {};
    Object.keys(items).forEach(item => {
      if (items[item].imgUrl) {
        const imgUrl = items[item].imgUrl;
        // imgUrl = https://i.ebayimg.com/images/g/UrMAAOSwrYRciv3e/s-l1600.jpg
        const splitUrl = imgUrl.split('/');
        const beforeIndex = splitUrl.indexOf('g');
        const imageId = splitUrl.slice(beforeIndex+1, beforeIndex+2)[0];
        // imageId = UrMAAOSwrYRciv3e
        const base64Code = imageId.slice(imageId.length - 5, imageId.length);
        // base64Code = civ3e
        const timeCode = decodeBase64(base64Code);
        // timeCode = [28, 34, 47, 55, 30]
        const age = calculateAge(timeCode);
        // age = {
        //   minutes: 332801,
        //   hours: 5546,
        //   days: 92,
        // }
        datedItems[item] = age;
      } else {
        // if no image url
        datedItems[item] = {
          minutes: -1,
        }
      }
    });
    return datedItems;
  }

  if (event.httpMethod === "OPTIONS") {
    callback(null, {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: "success",
        message: "Connected!"
      })
    });
  }
  else if (event.httpMethod === "POST") {
    const items = JSON.parse(event.body);
    if (Object.keys(items).length > 0) {
      const datedItems = translateDateCodes(items);  
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
  else {
  callback(null, {
    statusCode: 200,
    body: "This was not a POST request!"
  });
}
}