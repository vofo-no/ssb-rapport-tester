$ ->
  REPORT_YEAR = new Date().getFullYear()
  REPORT_YEAR-- if new Date().getMonth() < 4
  $('h1').text $('h1').text() + " " + REPORT_YEAR

  errCount = 0
  valCount = 0
  targetCount = -1

  resetCounters = ->
    errCount = 0
    valCount = 0
    targetCount = -1

  window.uploadData =
    rows: []
    errors: []
    reset: ()->
      window.uploadData.rows = []
      window.uploadData.errors = []
      resetCounters()
      if window.Worker
        validatorWorker.postMessage([false])
      else
        validatorInit()

  setStatus = (txt)->
    $('#analyzeStatus').text txt || 'Ingen fil er valgt'
  setStatus()

  showOutput = ()->
    $('#success, #errors').hide()
    if window.uploadData.errors.length
      $('#errors tbody').empty()
      for err in window.uploadData.errors
        row = $('<tr />')
        for i in [1...err.length] when i < 28
          row.append(makeCell(err[i], err[0][i-2]))
        row.append(makeCell(errorList(err[0]), true))
        $('#errors tbody').append(row)
      $('#errors').show()
    else
      $('#success').fadeIn() if valCount > 0
  showOutput()

  setStats = ->
    if targetCount > -1 && valCount + errCount == targetCount
      showOutput()
      $('#analyzeStatus2').text 'Ferdig! Antall gyldige rader: ' + valCount + ' - antall med feil: ' + errCount
    else
      $('#analyzeStatus2').text 'Analyserer... (' + Math.round(((valCount + errCount) / targetCount) * 100) + ' %) Antall gyldige rader: ' + valCount + ' - antall med feil: ' + errCount

  makeCell = (content, hasError)->
    $("<td />").append(content).addClass(if hasError then 'danger' else 'success')

  errorList = (errors)->
    list = $('<ul />')
    for key of errors
      li = list.append($('<li />').text(errors[key]))
    return list

  $('#fileInput').on 'change', (e)->
    return if e.target.files[0] == undefined
    window.uploadData.reset()
    showOutput()
    i = 0
    setStatus 'Leser fil...'
    $('#fileInput').prop 'disabled', true
    Papa.parse e.target.files[0],
      worker: true
      skipEmptyLines: true
      step: (row)->
        i++
        validateRowHandler row.data[0], i
      complete: ->
        setStatus 'Fil innlest. Fant ' + i + ' rader.'
        $('#fileInput').prop 'disabled', false
        targetCount = i
        setStats() unless window.Worker

  validatorWorker = new Worker(VALIDATOR_WORKER)
  if window.Worker
    validatorWorker.onerror = (e)->
      console.log e
    validatorWorker.onmessage = (e)->
      if e.data[0]
        valCount++
        window.uploadData.rows.push e.data[1]
      else
        errCount++
        window.uploadData.errors.push e.data[1]
      setStats()

  validateRowHandler = (row, line)->
    if window.Worker
      validatorWorker.postMessage [row, line]
    else
      result = validateRow(row, line)
      if result[0]
        valCount++
        window.uploadData.rows.push result[1]
      else
        errCount++
        window.uploadData.errors.push result[1]
      setStats()
