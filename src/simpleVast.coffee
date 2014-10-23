class @SimpleVast

  constructor: (options) ->
    name = 'simple VAST'

#    check if options object defined
    if !options
      console.log "#{name} options undefined!"
      return false

    console.log("#{name}: inited!") if options.dbg

#      defaults
#    ******************
    _self = @
    tryCount = 0

    vastAdObj =
      adTitle: null,
      impression: null,
      videoUrl: '',
      duration: null,
      customViewTracker: null,
      trackers: []

    eventMap = ['firstQuartile', 'midpoint', 'thirdQuartile', 'complete', 'mute', 'unmute', 'rewind', 'pause', 'resume', 'fullscreen', 'creativeView', 'acceptInvitation', 'start', 'complete']

#      public methods
#    ******************
    @getAd = (callback) ->
      _self.completeCallback = callback
      getTagData()


#    Utils
#    ******************
    getTagData = () ->
      tag = getNextTag()
      if tag
        console.log "#{name}: try get tag №#{tryCount} #{tag.url}" if options.dbg
        get tag.url, (data) =>
          if data
            parsedData = parseTag tag, data

            if parsedData
              _self.completeCallback parsedData
            else getTagData()

          else
            getTagData()
      else
        _self.completeCallback null

    parseTag = (tag, node) ->
      console.log "#{name}: search parser for #{tag.provider}" if options.dbg
      switch tag.provider.toLowerCase()
        when 'adfox' then parser = adfoxParser
        else console.log "#{name}: unknown parser for #{tag.provider}" if options.dbg

      parsedObj = parser node
      parsedObj

    getNextTag = ->
      console.log "............ \n#{name}: check if tag exists" if options.dbg
      tryCount++
      if options.vastTags[tryCount - 1]
        options.vastTags[tryCount - 1]
      else
        console.log "#{name}: no more tags" if options.dbg
        false

#      Parsers
#    ******************

    adfoxParser = (node) ->
      console.log "#{name}: try parse adfoxXML node" if options.dbg

      try
        if !node.querySelector('Ad')
          console.log "#{name}: VAST response is empty" if options.dbg
          return false

        trackingEvents = node.querySelector('TrackingEvents')

        vastAdObj.adTitle = if node.querySelector('AdTitle').childNodes[0] then node.querySelector('AdTitle').childNodes[0] else 'no title'
        vastAdObj.impression = node.querySelector('Impression').childNodes[0].data
        vastAdObj.videoUrl = node.querySelector('MediaFile').childNodes[0].data
        vastAdObj.duration = node.querySelector('Duration').innerHTML
        vastAdObj.customViewTracker = if node.querySelector('#secondaryAdServer') then node.querySelector('#secondaryAdServer').childNodes[0].data else null

        for tracker in eventMap
          tmpEventList = trackingEvents.querySelectorAll("[event='" + tracker + "']")

          for event in tmpEventList
            if !vastAdObj.trackers[tracker]
              vastAdObj.trackers[tracker] = []
            vastAdObj.trackers[tracker].push(event.childNodes[0].data)

        vastAdObj

      catch error
        console.log "#{name}: parser crashed!" if options.dbg

    #      Commons
#    ******************
    get = (url, callback) ->
      xhr = new XMLHttpRequest()
      xhr.open 'GET', url, true
      xhr.onreadystatechange = ->
        if xhr.readyState is 4
          if xhr.status != 200
            console.log("#{name}: response error") if options.dbg
            callback(null)
          else
            try
              callback(@responseXML.documentElement)
            catch err
              console.log("#{name}: unknown response") if options.dbg
              callback(null)
      xhr.send()