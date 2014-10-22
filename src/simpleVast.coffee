class @SimpleVast

  constructor: (options) ->
    name = 'simple VAST'

#    check if options object defined
    if !options
      console.log "#{name} options undefined!"
      return false

    console.log("#{name}: inited!") if options.dbg

    _self = @
    tryCount = 0

    @getAd = (callback) ->
      _self.completeCallback = callback
      getTagData()


#    Utils
    getTagData = () ->
      tag = getNextTag()
      if tag
        console.log "#{name}: try get tag №#{tryCount} #{tag}" if options.dbg
        get tag, (data) =>
          if data
            _self.completeCallback data
          else
            getTagData()
      else
        _self.completeCallback null


    getNextTag = ->
      console.log "............ \n#{name}: check if tag exists" if options.dbg
      tryCount++
      if options.vastTags[tryCount - 1]
        options.vastTags[tryCount - 1]
      else
        console.log "#{name}: no more tags" if options.dbg
        false


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

#    @getConfig = -> advConfig