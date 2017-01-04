@onmessage = (e)->
  if e.data[0] == false
    validatorInit()
  else
    self.postMessage(validateRow(e.data[0], e.data[1]))

@validator_seen_ids = []
VALID_STFS = [2501,2503,2504,2508,2510,2521,2525,2534,2535,2536,2538,2539,2542,2545,2551]
VALID_SUBJECTS = [101,102,103,104,105,106,107,108,109,110,111,112,199,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,230,231,232,233,234,298,299,301,302,303,304,305,306,307,308,398,399,401,402,403,404,405,406,407,408,409,410,499,501,502,503,504,505,506,507,508,599,601,602,603,604,605,606,607,608,609,610,611,612,698,699,701,702,703,704,705,706,720,721,722,723,724,799,801,802,803,899,901,902,903,904,905,906,907,908,909,910,911,912,998,999,1001,1002,1003,1004,1005,1006,1007,1020,1099,1101,1102,1103,1104,1105,1199]
REPORT_YEAR = new Date().getFullYear()
REPORT_YEAR -= 1 if new Date().getMonth() < 4

MUNICIPALITIES = [2111,2121,2131,2211,2311,2321]

for county in [1..22] when county != 13
  MUNICIPALITIES.push county * 100

xhr = new XMLHttpRequest()
xhr.onreadystatechange = ()->
  if xhr.readyState == XMLHttpRequest.DONE
    if xhr.status == 200
      for kommune in JSON.parse(xhr.responseText).codes
        MUNICIPALITIES.push parseInt(kommune.code)
xhr.open('GET', "http://data.ssb.no/api/klass/v1/classifications/131/codesAt.json?date=#{REPORT_YEAR}-12-31", true)
xhr.setRequestHeader('Accept', 'application/json')
xhr.send()

validatorInit = ->
  @validator_seen_ids = []

validDate = (datestr, maxDate, minDate)->
  return [false, 'har ikke et gyldig format (dd.mm.åå).'] unless datestr && datestr.match /^\d\d?\.\d\d?\.\d\d(?:\d\d)?$/
  dateParts = datestr.split '.'
  if dateParts[2].length == 2
    dateParts[2] = 2000 + parseInt(dateParts[2])
  else
    dateParts[2] = parseInt(dateParts[2])
  dateParts[1] = parseInt(dateParts[1]) - 1
  dateParts[0] = parseInt(dateParts[0])
  date = new Date(dateParts[2], dateParts[1], dateParts[0])
  return [false, datestr + ' finnes ikke.'] unless date.getFullYear() == dateParts[2] && date.getMonth() == dateParts[1] && date.getDate() == dateParts[0]
  return [false, 'må være tidligere enn ' + maxDate.toLocaleDateString()] unless date <= maxDate
  return [false, 'må være senere enn ' + minDate.toLocaleDateString()] unless date >= minDate
  return [date, false]

validateRow = (row, line)->
  rowErrs = {}

  if row.length < 26
    rowErrs['-1'] = 'Forventet 26 felter. Hopper over denne raden.'
  else
    #parse numbers to integers
    for i in [0..25]
      row[i] = row[i].toString().replace ',', '.'
      row[i] = Math.floor(row[i]) unless isNaN(row[i])

    rowErrs['0'] = 'Studieforbundets nummer er ikke gyldig' unless row[0] in VALID_STFS

    unless row[1] == null || row[1].toString().match(/^\d{0,3}$/)
      rowErrs['1'] = 'Medlemsorganisasjon skal være blankt eller et siffer mellom 1 og 999.'

    rowErrs['2'] = 'Kommunenummeret finnes ikke' unless row[2] in MUNICIPALITIES

    if not row[3].toString().match(/^\d{1,7}$/)
      rowErrs['3'] = 'Kursid skal bestå av 7 siffer.'
    else if (row[3] + '@' + row[0]) in @validator_seen_ids
      rowErrs['3'] = 'Kursid må være unikt.'

    rowErrs['4'] = 'Emnekoden er ikke gyldig.' unless row[4] in VALID_SUBJECTS

    rowErrs['5'] = 'Nivå er ikke gyldig' unless row[5] in [1,2,3,9]

    switch row[5]
      when 1
        rowErrs['6'] = 'Ugyldig eksamenskode for grunnivå' unless row[6] in [10,11,20,30,99]
      when 2
        rowErrs['6'] = 'Ugyldig eksamenskode for videregående nivå' unless row[6] in [10,12,13,20,30,40,99]
      when 3
        rowErrs['6'] = 'Ugyldig eksamenskode for høyere nivå' unless row[6] in [10,13,14,20,30,99]
      else
        rowErrs['6'] = 'Ugyldig eksamenskode for uoppgitt nivå' unless row[6] in [30,99]

    males = 0
    for i in [7..12]
      rowErrs[i.toString()] = 'Kursdeltakere må være et postivt heltall' unless row[i] >= 0
      males += row[i]

    females = 0
    for i in [13..18]
      rowErrs[i.toString()] = 'Kursdeltakere må være et postivt heltall' unless row[i] >= 0
      females += row[i]

    rowErrs['-2'] = 'Kurset må ha deltakere.' unless males + females > 0

    rowErrs['19'] = 'Antall menn med tilretteleggingstilskudd må være et positivt heltall' unless row[19] >= 0
    rowErrs['19'] = 'Antall menn med tilretteleggingstilskudd skal ikke være større enn antall menn' unless row[19] <= males

    rowErrs['20'] = 'Antall kvinner med tilretteleggingstilskudd må være et positivt heltall' unless row[20] >= 0
    rowErrs['20'] = 'Antall kvinner med tilretteleggingstilskudd skal ikke være større enn antall kvinner' unless row[20] <= females

    startDate = validDate(row[21], new Date(REPORT_YEAR,11,31), new Date(REPORT_YEAR - 3,0,1))
    unless startDate[0]
      rowErrs['21'] = 'Startdato ' + startDate[1]

    endDate = validDate(row[22], new Date(REPORT_YEAR + 1,1,20), if startDate[0] then startDate[0] else new Date(REPORT_YEAR - 3,0,1))
    unless endDate[0]
      rowErrs['22'] = 'Sluttdato ' + endDate[1]

    rowErrs['23'] = 'Kurset må ha minst 8 timer' unless row[23] >= 8
    if startDate[0] && endDate[0]
      unless (Math.round(Math.abs((startDate[0].getTime() - endDate[0].getTime())/86400000)) + 1) * 24 >= row[23]
        rowErrs['23'] = 'Det er ikke ' + row[23] + ' timer innenfor kursets varighet.'

    rowErrs['24'] = 'Timer med elektronisk kommunikasjon må være et positivt heltall.' unless row[24] >= 0
    rowErrs['24'] = 'Fysiske samlinger skal utgjøre mer enn halvparten av totalt antall kurstimer.' unless row[24] <= row[23] / 2

    rowErrs['25'] = 'Ugyldig kode for tidspunkt' unless row[25].toString().match /^[123]$/

  if Object.keys(rowErrs).length
    row.unshift rowErrs, line
    return [false, row]
  else
    @validator_seen_ids.push row[3] + '@' + row[0]
    return [true, row]
