const $ = require("jquery");
const fs = require("fs");

// data for the api request:
var key = "AIzaSyDeXi9GABxJhqK8u9nj86NsayQJzMiPC_Q";
var apiVideoURL = "https://www.googleapis.com/youtube/v3/videos";
var videoPart = "snippet, statistics, contentDetails, recordingDetails";
var apiChannelURL = "https://www.googleapis.com/youtube/v3/channels";
var channelPart = "snippet, statistics";

// global sorted data variable:
var sortedVideoData = {};
// global variable with the answers to the questions
var questionAnswer = [];

// FUNCTIONS THAT PERFORM A LARGE TASK, LOADING DATA, WRITING DATA...
function goButtonPressed(
  key,
  apiVideoURL,
  videoPart,
  apiChannelURL,
  channelPart
) {
  // function is executed when the button is pressed,

  // the id set by the person
  var ownIdInput = $("#ownIdInput").val();

  var videoLink = $("#videoLinkInput").val();
  var videoId = idFromLink(videoLink);

  // options for the get request to the youtube api
  var videoOptions = {
    part: videoPart,
    key: key,
    id: videoId,
  };

  // get video data and sort it

  $.getJSON(apiVideoURL, videoOptions, function (rawVideoData) {
    console.log(rawVideoData);

    date = new Date();
    sortedVideoData = sortVideoData(rawVideoData, ownIdInput, date);

    // set up channel options for GET request
    var channelOptions = {
      part: channelPart,
      key: key,
      id: sortedVideoData.channel.id,
    };

    // get channel data and sort it
    $.getJSON(apiChannelURL, channelOptions, function (rawChannelData) {
      // log the data in the console
      console.log(rawChannelData);
      sortedVideoData = sortChannelData(sortedVideoData, rawChannelData);
      console.log(sortedVideoData);

      // show preview of video title and thumbnail
      var videoTitleLabel = document.getElementById("videoTitleLabel");
      videoTitleLabel.innerHTML = sortedVideoData.video.title;
      var videoThumb = document.getElementById("videoThumb");
      videoThumb.src = sortedVideoData.video.thumbURL;

      // enable export button
      exportButton = document.getElementById("exportButton");
      exportButton.disabled = false;

      // after loading data, disable go button and link input field
      goButton = document.getElementById("submitVideoLink");
      goButton.disabled = true;
      videoLinkInput = document.getElementById("videoLinkInput");
      videoLinkInput.disabled = true;

      createForm(sortedVideoData);
    });
  }).fail(function () {
    alert("No Connection");
  });
}

function createForm(sortedData) {
  for (var i = 0; i < 70; i++) {
    try {
      formId = questionData[i].formId;
      question = questionData[i].question;
      typeInput = questionData[i].typeInput;

      if (typeInput == true) {
        type = questionData[i].type;
        $("#formSection").append(`
          <article class="item" data-key="${formId}">
            <h4>${question}</h4>
            <input
              type="${type}"
              name="input${formId}"
              value=""
              id="input${formId}"
              class="input${formId}"
            />
          </article>
            `);
      }

      if (typeInput == false) {
        buttonLabel = questionData[i].buttonLabel;
        buttonData = questionData[i].buttonData;
        $("#formSection").append(
          buttonArticleFun(formId, question, buttonData, buttonLabel)
        );
      }
    } catch (err) {
      //question does not exist, try next question
    }
  }
}

function formButtonPressed(formId, buttonData, buttonNo) {
  // set the data to the answer that was clicked
  questionAnswer[formId] = buttonData;

  buttonCount = questionData[formId].buttonData.length;
  // set all buttons to inactive and then set the button that was clicket to active
  for (var i = 0; i < buttonCount; i++) {
    buttons = document.getElementById((id = "button" + i + formId));
    buttons.className = "buttonNotClicked";
  }
  button = document.getElementById((id = "button" + buttonNo + formId));
  button.className = "buttonClicked";
}

function setInputData() {
  sortedData.ownId = $("#ownIdInput").val();

  for (var formId = 0; formId < 70; formId++) {
    try {
      if (questionData[formId].typeInput == true) {
        input = $("#input" + formId).val();
        if (input == "") {
          questionAnswer[formId] = questionData[formId].noInputData;
        } else {
          questionAnswer[formId] = input;
        }
      }
    } catch {
      //data is not an input field
    }
  }
}

function excelFileButton(sortedData, questionAnswer) {
  // set the ownId again

  setInputData();

  // create excel file
  excelFile = emptyExcelSheet();
  emptyCells = excelFile.cells;

  //put the video data from the youtube api into the specific cells
  cells = apiDataInCells(emptyCells, sortedData);

  // put the data from the questionaire into the specific cells
  filledCells = questionDataInCells(cells, questionAnswer);

  // open user dialog to write the data to file
  const dialog = require("electron").remote.dialog;
  const options = {
    defaultPath: __dirname + "/" + sortedData.ownId + ".xlsx",
  };

  dialog.showSaveDialog(null, options).then(function (promise) {
    if (promise.canceled) {
      alert("File Was Not Saved");
    } else {
      console.log(promise.filePath);
      //Save Excel on Hard Disk
      excelFile.workbook.xlsx.writeFile(promise.filePath).then(function () {
        //Success Message
        alert("File Saved");
      });
    }
  });
}

function reloadButton() {
  // reload the page
  location.reload();
}

// FUNCTIONS THAT TRANSFORM DATA

function emptyExcelSheet() {
  // Create a new sheet and assign the cells to their intended content

  // polyfills for any missing functionalities
  require("react-app-polyfill/ie9");
  require("react-app-polyfill/stable");

  // polyfills required by exceljs
  require("core-js/modules/es.promise");
  require("core-js/modules/es.string.includes");
  require("core-js/modules/es.object.assign");
  require("core-js/modules/es.object.keys");
  require("core-js/modules/es.symbol");
  require("core-js/modules/es.symbol.async-iterator");
  require("regenerator-runtime/runtime");

  const Excel = require("exceljs/dist/es5");

  // A new Excel Work Book
  var workbook = new Excel.Workbook();

  // Some information about the Excel Work Book.
  workbook.creator = "Farisa Afzal";

  // Create a sheet
  var sheet = workbook.addWorksheet("Sheet1");

  // find locations of all the data which can be put into the excel sheet
  cells = {};
  cells.questionCell = [];

  cells.fourLetter = sheet.getCell("C1");
  cells.recordingDate = sheet.getCell("D1");
  cells.codingPerson = sheet.getCell("E1");
  cells.videoLink = sheet.getCell("F1");
  cells.videoTitle = sheet.getCell("G1");
  cells.ownId = sheet.getCell("H1");
  cells.videoDuration = sheet.getCell("I1");
  cells.channelName = sheet.getCell("J1");
  cells.questionCell[10] = sheet.getCell("K1");
  cells.questionCell[11] = sheet.getCell("L1");
  cells.questionCell[12] = sheet.getCell("M1");
  cells.questionCell[13] = sheet.getCell("N1");
  cells.questionCell[14] = sheet.getCell("O1");
  cells.questionCell[15] = sheet.getCell("P1");
  cells.channelSubs = sheet.getCell("Q1");
  cells.questionCell[17] = sheet.getCell("R1");
  cells.questionCell[18] = sheet.getCell("S1");
  cells.questionCell[19] = sheet.getCell("T1");
  cells.questionCell[20] = sheet.getCell("U1");
  cells.questionCell[21] = sheet.getCell("V1");
  cells.questionCell[22] = sheet.getCell("W1");
  cells.questionCell[23] = sheet.getCell("X1");
  cells.questionCell[24] = sheet.getCell("Y1");
  cells.questionCell[25] = sheet.getCell("Z1");
  cells.questionCell[26] = sheet.getCell("AA1");
  cells.questionCell[27] = sheet.getCell("AB1");
  cells.questionCell[28] = sheet.getCell("AC1");
  cells.channelJoin = sheet.getCell("AD1");
  cells.channelVideoCount = sheet.getCell("AE1");
  cells.questionCell[31] = sheet.getCell("AF1");
  cells.videoDate = sheet.getCell("AG1");
  cells.videoViews = sheet.getCell("AH1");
  cells.videoUpvotes = sheet.getCell("AI1");
  cells.videoDownvotes = sheet.getCell("AJ1");
  cells.questionCell[36] = sheet.getCell("AK1");
  cells.questionCell[37] = sheet.getCell("AL1");
  cells.questionCell[38] = sheet.getCell("AM1");
  cells.questionCell[39] = sheet.getCell("AN1");
  cells.questionCell[40] = sheet.getCell("AO1");
  cells.questionCell[41] = sheet.getCell("AP1");
  cells.questionCell[42] = sheet.getCell("AQ1");
  cells.questionCell[43] = sheet.getCell("AR1");
  cells.questionCell[44] = sheet.getCell("AS1");
  cells.questionCell[45] = sheet.getCell("AT1");
  cells.questionCell[46] = sheet.getCell("AU1");
  cells.questionCell[47] = sheet.getCell("AV1");
  cells.questionCell[48] = sheet.getCell("AW1");
  cells.commentsCount = sheet.getCell("AX1");
  cells.questionCell[50] = sheet.getCell("AY1");
  cells.questionCell[51] = sheet.getCell("AZ1");
  cells.questionCell[52] = sheet.getCell("BA1");
  cells.questionCell[53] = sheet.getCell("BB1");
  cells.questionCell[54] = sheet.getCell("BC1");
  cells.questionCell[55] = sheet.getCell("BD1");
  cells.questionCell[56] = sheet.getCell("BE1");
  cells.questionCell[57] = sheet.getCell("BF1");
  cells.questionCell[58] = sheet.getCell("BG1");
  cells.questionCell[59] = sheet.getCell("BH1");
  cells.questionCell[60] = sheet.getCell("BI1");
  cells.questionCell[61] = sheet.getCell("BJ1");
  cells.questionCell[62] = sheet.getCell("BK1");
  cells.questionCell[63] = sheet.getCell("BL1");
  cells.questionCell[64] = sheet.getCell("BM1");
  cells.questionCell[65] = sheet.getCell("BN1");
  cells.questionCell[66] = sheet.getCell("BO1");
  cells.questionCell[67] = sheet.getCell("BP1");
  cells.questionCell[68] = sheet.getCell("BQ1");

  excelFile = {
    workbook,
    sheet,
    cells,
  };

  return excelFile;
}

function apiDataInCells(emptyCells, sortedData) {
  //put the video data from the youtube api into the specific cells
  cells = emptyCells;

  cells.fourLetter.value = sortedData.fourLetter;
  cells.ownId.value = sortedData.ownId;
  cells.recordingDate.value = sortedData.recordingDate;
  cells.codingPerson.value = sortedData.codingPerson;

  cells.videoTitle.value = sortedData.video.title;
  cells.videoLink.value = sortedData.video.link;
  cells.videoDuration.value = sortedData.video.duration;
  cells.videoUpvotes.value = sortedData.video.upvoteCount;
  cells.videoDownvotes.value = sortedData.video.downvoteCount;
  cells.commentsCount.value = sortedData.video.commentsCount;
  cells.videoViews.value = sortedData.video.viewCount;
  cells.videoDate.value = sortedData.video.uploadDate;

  cells.channelName.value = sortedData.channel.name;
  cells.channelJoin.value = sortedData.channel.publish;
  cells.channelSubs.value = sortedData.channel.subsCount;
  cells.channelVideoCount.value = sortedData.channel.videoCount;

  return cells;
}

function questionDataInCells(cells, questionAnswer) {
  filledCells = cells;

  for (var i = 0; i < 70; i++) {
    try {
      filledCells.questionCell[i].value = questionAnswer[i];
    } catch (err) {
      //question does not exist, try next question
    }
  }
}

function sortVideoData(data, ownIdInput, date) {
  var month = pad2(Number(date.getMonth()) + 1);
  var day = pad2(date.getDate());
  var year = pad2(date.getFullYear());

  sortedData = {};
  sortedData.video = {};
  sortedData.channel = {};

  sortedData.fourLetter = getFourLetters(
    data.items[0].snippet.channelTitle,
    data.items[0].snippet.title
  );
  sortedData.ownId = ownIdInput;
  sortedData.recordingDate = day + "." + month + "." + year;
  sortedData.codingPerson = "FA";

  sortedData.video.title = data.items[0].snippet.title;
  sortedData.video.id = data.items[0].id;
  sortedData.video.link = "https://www.youtube.com/watch?v=" + data.items[0].id;
  sortedData.video.duration = formatVideoLength(
    data.items[0].contentDetails.duration
  );
  sortedData.video.upvoteCount = data.items[0].statistics.likeCount;
  sortedData.video.downvoteCount = data.items[0].statistics.dislikeCount;
  sortedData.video.commentsCount = data.items[0].statistics.commentCount;
  sortedData.video.viewCount = data.items[0].statistics.viewCount;
  sortedData.video.thumbURL = data.items[0].snippet.thumbnails.medium.url;
  sortedData.video.uploadDate = fullTimeToDate(
    data.items[0].snippet.publishedAt
  );
  sortedData.channel.name = data.items[0].snippet.channelTitle;
  sortedData.channel.id = data.items[0].snippet.channelId;

  return sortedData;
}

function sortChannelData(videoData, channelData) {
  videoData.channel.publish = fullTimeToDate(
    channelData.items[0].snippet.publishedAt
  );
  videoData.channel.subsCount = channelData.items[0].statistics.subscriberCount;
  videoData.channel.videoCount = channelData.items[0].statistics.videoCount;

  return videoData;
}

function idFromLink(videoLink) {
  VID_REGEX = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  return videoLink.match(VID_REGEX)[1];
}

function getFourLetters(channelName, videoTitle) {
  // takes the first four letters of the channel name and the video title
  fourLower = channelName.substr(0, 4) + videoTitle.substr(0, 4);
  fourUpper = fourLower.toUpperCase();
  return fourUpper;
}

function pad2(number) {
  return (number < 10 ? "0" : "") + number;
}

function fullTimeToDate(fullTime) {
  year = fullTime.substring(0, 4);
  month = fullTime.substring(5, 7);
  day = fullTime.substring(8, 10);
  return day + "." + month + "." + year;
}

function formatVideoLength(apiFormat) {
  matches = apiFormat.match(/\d+/g);

  if (matches.length == 3) {
    hours = matches[0];
    minutes = matches[1];
    seconds = matches[2];
  }
  if (matches.length == 2) {
    hours = 0;
    minutes = matches[0];
    seconds = matches[1];
  }
  if (matches.length == 1) {
    hours = 0;
    minutes = 0;
    seconds = matches[0];
  }

  formattedLength = pad2(hours) + ":" + pad2(minutes) + ":" + pad2(seconds);
  return formattedLength;
}

// NOT IN USE

function writeDataJSON(newData, fileName) {
  //check if file exists
  $.ajax({
    url: `${fileName}.json`,
    type: "HEAD",
    error: function () {
      // file does not exist
      data = [];
    },
    success: function () {
      // file exists
      // load file and any data it contains
      data = [
        JSON.parse(
          fs.readFileSync(fileName + ".json", function (err) {
            if (err) {
              console.log(err);
            } else {
              //Everything went OK!
            }
          })
        ),
      ];
    },
  });

  // add the new data
  data.push(newData);

  //convert data into json format
  jsonData = JSON.stringify(data);

  //write the json data to a file on disk
  fs.writeFile(fileName + ".json", jsonData, "utf8", function (err) {
    if (err) {
      console.log(err);
    } else {
      //Everything went OK!
    }
  });
}
