(function() {
  this.SimpleVast = (function() {
    function SimpleVast(options) {
      var adfoxParser, dfpParser, eventMap, get, getNextTag, getTagData, name, openxParser, parseTag, resetVastObject, tryCount, vastAdObj, _self;
      name = 'simple VAST';
      if (!options) {
        console.log("" + name + " options undefined!");
        return false;
      }
      if (options.dbg) {
        console.log("" + name + ": inited!");
      }
      _self = this;
      tryCount = 0;
      vastAdObj = {
        adTitle: null,
        impression: null,
        videoUrl: '',
        duration: null,
        customViewTracker: null,
        clickUrl: null,
        trackers: []
      };
      eventMap = ['firstQuartile', 'midpoint', 'thirdQuartile', 'complete', 'mute', 'unmute', 'rewind', 'pause', 'resume', 'fullscreen', 'creativeView', 'acceptInvitation', 'start', 'complete'];
      this.getAd = function(callback) {
        _self.completeCallback = callback;
        resetVastObject();
        return getTagData();
      };
      getTagData = function() {
        var tag;
        tag = getNextTag();
        if (tag) {
          if (options.dbg) {
            console.log("" + name + ": try get tag №" + tryCount + " " + tag.url);
          }
          return get(tag.url, (function(_this) {
            return function(data) {
              var parsedData;
              if (data) {
                parsedData = parseTag(tag, data);
                if (parsedData) {
                  return _self.completeCallback(parsedData);
                } else {
                  return getTagData();
                }
              } else {
                return getTagData();
              }
            };
          })(this));
        } else {
          return _self.completeCallback(null);
        }
      };
      parseTag = function(tag, node) {
        var parsedObj, parser;
        if (options.dbg) {
          console.log("" + name + ": search parser for " + tag.provider);
        }
        switch (tag.provider.toLowerCase()) {
          case 'adfox':
            parser = adfoxParser;
            break;
          case 'openx':
            parser = openxParser;
            break;
          case 'dfp':
            parser = dfpParser;
            break;
          default:
            if (options.dbg) {
              console.log("" + name + ": unknown parser for " + tag.provider);
            }
        }
        parsedObj = parser(node);
        return parsedObj;
      };
      getNextTag = function() {
        if (options.dbg) {
          console.log("............ \n" + name + ": check if tag exists");
        }
        tryCount++;
        if (options.vastTags[tryCount - 1]) {
          return options.vastTags[tryCount - 1];
        } else {
          if (options.dbg) {
            console.log("" + name + ": no more tags");
          }
          return false;
        }
      };
      resetVastObject = function() {
        return vastAdObj = {
          adTitle: null,
          impression: null,
          videoUrl: '',
          duration: null,
          customViewTracker: null,
          trackers: []
        };
      };
      dfpParser = function(node) {
        var error, event, tmpEvent, tracker, trackingEvents, _i, _j, _len, _len1;
        if (options.dbg) {
          console.log("" + name + ": try parse dfpParser node");
        }
        try {
          if (!node.querySelector('Ad')) {
            if (options.dbg) {
              console.log("" + name + ": VAST response is empty");
            }
            return false;
          }
          trackingEvents = node.querySelector('TrackingEvents');
          vastAdObj.adTitle = node.querySelector('AdTitle').childNodes[0] ? node.querySelector('AdTitle').childNodes[0].data : null;
          vastAdObj.impression = node.querySelector('Impression').childNodes[0] ? node.querySelector('Impression').childNodes[0].data : null;
          vastAdObj.videoUrl = node.querySelector('MediaFiles>MediaFile').childNodes[0] ? node.querySelector('MediaFiles>MediaFile').childNodes[0].data : null;
          vastAdObj.duration = node.querySelector('Creative Duration').innerHTML ? node.querySelector('Creative Duration').innerHTML : null;
          vastAdObj.customViewTracker = node.querySelector('#secondaryAdServer') ? node.querySelector('#secondaryAdServer').childNodes[0].data : null;
          vastAdObj.clickUrl = node.querySelector('VideoClicks ClickThrough') ? node.querySelector('VideoClicks ClickThrough').childNodes[0].data : null;
          for (_i = 0, _len = eventMap.length; _i < _len; _i++) {
            tracker = eventMap[_i];
            tmpEvent = trackingEvents.querySelectorAll("[event='" + tracker + "']");
            for (_j = 0, _len1 = tmpEvent.length; _j < _len1; _j++) {
              event = tmpEvent[_j];
              if (!vastAdObj.trackers[tracker]) {
                vastAdObj.trackers[tracker] = [];
              }
              vastAdObj.trackers[tracker].push(event.childNodes[0].data);
            }
          }
          return vastAdObj;
        } catch (_error) {
          error = _error;
          if (options.dbg) {
            console.error("" + name + ": parser crashed!");
          }
          return console.log(error);
        }
      };
      openxParser = function(node) {
        var error, tmpEvent, tracker, trackingEvents, _i, _len;
        if (options.dbg) {
          console.log("" + name + ": try parse openxParser node");
        }
        try {
          if (!node.querySelector('Ad')) {
            if (options.dbg) {
              console.log("" + name + ": VAST response is empty");
            }
            return false;
          }
          trackingEvents = node.querySelector('TrackingEvents');
          vastAdObj.adTitle = node.querySelector('AdTitle').childNodes[0].data;
          vastAdObj.impression = node.querySelector('#primaryAdServer').childNodes[0].data;
          vastAdObj.videoUrl = node.querySelector('MediaFile>URL').childNodes[0].data;
          vastAdObj.duration = node.querySelector('Video>Duration').innerHTML;
          vastAdObj.customViewTracker = node.querySelector('#secondaryAdServer') ? node.querySelector('#secondaryAdServer').childNodes[0].data : null;
          for (_i = 0, _len = eventMap.length; _i < _len; _i++) {
            tracker = eventMap[_i];
            tmpEvent = trackingEvents.querySelector("[event='" + tracker + "']");
            if (tmpEvent && tmpEvent.querySelector) {
              vastAdObj.trackers[tracker] = [tmpEvent.querySelector('URL').childNodes[0].data];
              if (eventMap[tracker] === 'start' && vastAdObj.customViewTracker) {
                vastAdObj.trackers[tracker].push(vastAdObj.customViewTracker);
              }
            }
          }
          return vastAdObj;
        } catch (_error) {
          error = _error;
          if (options.dbg) {
            return console.error("" + name + ": parser crashed!");
          }
        }
      };
      adfoxParser = function(node) {
        var error, event, tmpEventList, tracker, trackingEvents, _i, _j, _len, _len1;
        if (options.dbg) {
          console.log("" + name + ": try parse adfoxXML node");
        }
        try {
          if (!node.querySelector('Ad')) {
            if (options.dbg) {
              console.log("" + name + ": VAST response is empty");
            }
            return false;
          }
          trackingEvents = node.querySelector('TrackingEvents');
          vastAdObj.adTitle = node.querySelector('AdTitle').childNodes[0] ? node.querySelector('AdTitle').childNodes[0] : 'no title';
          vastAdObj.impression = node.querySelector('Impression').childNodes[0].data;
          vastAdObj.videoUrl = node.querySelector('MediaFile').childNodes[0].data;
          vastAdObj.duration = node.querySelector('Duration').innerHTML;
          vastAdObj.customViewTracker = node.querySelector('#secondaryAdServer') ? node.querySelector('#secondaryAdServer').childNodes[0].data : null;
          for (_i = 0, _len = eventMap.length; _i < _len; _i++) {
            tracker = eventMap[_i];
            tmpEventList = trackingEvents.querySelectorAll("[event='" + tracker + "']");
            for (_j = 0, _len1 = tmpEventList.length; _j < _len1; _j++) {
              event = tmpEventList[_j];
              if (!vastAdObj.trackers[tracker]) {
                vastAdObj.trackers[tracker] = [];
              }
              vastAdObj.trackers[tracker].push(event.childNodes[0].data);
            }
          }
          return vastAdObj;
        } catch (_error) {
          error = _error;
          if (options.dbg) {
            return console.error("" + name + ": parser crashed!");
          }
        }
      };
      get = function(url, callback) {
        var xhr;
        xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function() {
          var err;
          if (xhr.readyState === 4) {
            if (xhr.status !== 200) {
              if (options.dbg) {
                console.log("" + name + ": response error");
              }
              return callback(null);
            } else {
              try {
                return callback(this.responseXML.documentElement);
              } catch (_error) {
                err = _error;
                if (options.dbg) {
                  console.log("" + name + ": unknown response");
                }
                return callback(null);
              }
            }
          }
        };
        return xhr.send();
      };
    }

    return SimpleVast;

  })();

}).call(this);

//# sourceMappingURL=simpleVast.js.map
