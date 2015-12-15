(function() {
  var MUNICIPALITIES, REPORT_YEAR, VALID_STFS, VALID_SUBJECTS, county, j, validDate, validateRow, validatorInit, xhr,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  this.onmessage = function(e) {
    if (e.data[0] === false) {
      return validatorInit();
    } else {
      return self.postMessage(validateRow(e.data[0], e.data[1]));
    }
  };

  this.validator_seen_ids = [];

  VALID_STFS = [2501, 2503, 2504, 2508, 2510, 2521, 2525, 2534, 2535, 2536, 2538, 2539, 2542, 2545, 2551];

  VALID_SUBJECTS = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 199, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 230, 231, 232, 233, 234, 298, 299, 301, 302, 303, 304, 305, 306, 307, 308, 398, 399, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 499, 501, 502, 503, 504, 505, 506, 507, 508, 599, 601, 602, 603, 604, 605, 606, 607, 608, 609, 610, 611, 612, 698, 699, 701, 702, 703, 704, 705, 706, 720, 721, 722, 723, 724, 799, 801, 802, 803, 899, 901, 902, 903, 904, 905, 906, 907, 908, 909, 910, 911, 912, 998, 999, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1020, 1099, 1101, 1102, 1103, 1104, 1105, 1199];

  REPORT_YEAR = new Date().getFullYear();

  if (new Date().getMonth() < 4) {
    REPORT_YEAR -= 1;
  }

  MUNICIPALITIES = [2111, 2121, 2131, 2211, 2311, 2321];

  for (county = j = 1; j <= 22; county = ++j) {
    if (county !== 13) {
      MUNICIPALITIES.push(county * 100);
    }
  }

  xhr = new XMLHttpRequest();

  xhr.onreadystatechange = function() {
    var k, kommune, len, ref, results;
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) {
        ref = JSON.parse(xhr.responseText).kommuner;
        results = [];
        for (k = 0, len = ref.length; k < len; k++) {
          kommune = ref[k];
          results.push(MUNICIPALITIES.push(parseInt(kommune.nummer)));
        }
        return results;
      }
    }
  };

  xhr.open('GET', 'https://www.vegvesen.no/nvdb/api/omrader/kommuner', true);

  xhr.setRequestHeader('Accept', 'application/vnd.vegvesen.nvdb-v1+json');

  xhr.send();

  validatorInit = function() {
    return this.validator_seen_ids = [];
  };

  validDate = function(datestr, maxDate, minDate) {
    var date, dateParts;
    if (!datestr.match(/^\d\d?\.\d\d?\.\d\d(?:\d\d)?$/)) {
      return [false, 'har ikke et gyldig format (dd.mm.åå).'];
    }
    dateParts = datestr.split('.');
    if (dateParts[2].length === 2) {
      dateParts[2] = 2000 + parseInt(dateParts[2]);
    } else {
      dateParts[2] = parseInt(dateParts[2]);
    }
    dateParts[1] = parseInt(dateParts[1]) - 1;
    dateParts[0] = parseInt(dateParts[0]);
    date = new Date(dateParts[2], dateParts[1], dateParts[0]);
    if (!(date.getFullYear() === dateParts[2] && date.getMonth() === dateParts[1] && date.getDate() === dateParts[0])) {
      return [false, datestr + ' finnes ikke.'];
    }
    if (!(date <= maxDate)) {
      return [false, 'må være tidligere enn ' + maxDate.toLocaleDateString()];
    }
    if (!(date >= minDate)) {
      return [false, 'må være senere enn ' + minDate.toLocaleDateString()];
    }
    return [date, false];
  };

  validateRow = function(row, line) {
    var endDate, females, i, k, l, m, males, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, rowErrs, startDate;
    rowErrs = {};
    if (row.length < 26) {
      rowErrs['-1'] = 'Forventet 26 felter. Hopper over denne raden.';
    } else {
      for (i = k = 0; k <= 25; i = ++k) {
        if (!isNaN(row[i])) {
          row[i] = Math.floor(row[i]);
        }
      }
      if (ref = row[0], indexOf.call(VALID_STFS, ref) < 0) {
        rowErrs['0'] = 'Studieforbundets nummer er ikke gyldig';
      }
      if (!(row[1] === null || row[1].toString().match(/^\d{0,3}$/))) {
        rowErrs['1'] = 'Medlemsorganisasjon skal være blankt eller et siffer mellom 1 og 999.';
      }
      if (ref1 = row[2], indexOf.call(MUNICIPALITIES, ref1) < 0) {
        rowErrs['2'] = 'Kommunenummeret finnes ikke';
      }
      if (!row[3].toString().match(/^\d{1,7}$/)) {
        rowErrs['3'] = 'Kursid skal bestå av 7 siffer.';
      } else if (ref2 = row[3] + '@' + row[0], indexOf.call(this.validator_seen_ids, ref2) >= 0) {
        rowErrs['3'] = 'Kursid må være unikt.';
      }
      if (ref3 = row[4], indexOf.call(VALID_SUBJECTS, ref3) < 0) {
        rowErrs['4'] = 'Emnekoden er ikke gyldig.';
      }
      if ((ref4 = row[5]) !== 1 && ref4 !== 2 && ref4 !== 3 && ref4 !== 9) {
        rowErrs['5'] = 'Nivå er ikke gyldig';
      }
      switch (row[5]) {
        case 1:
          if ((ref5 = row[6]) !== 10 && ref5 !== 11 && ref5 !== 20 && ref5 !== 30 && ref5 !== 99) {
            rowErrs['6'] = 'Ugyldig eksamenskode for grunnivå';
          }
          break;
        case 2:
          if ((ref6 = row[6]) !== 10 && ref6 !== 12 && ref6 !== 13 && ref6 !== 20 && ref6 !== 30 && ref6 !== 40 && ref6 !== 99) {
            rowErrs['6'] = 'Ugyldig eksamenskode for videregående nivå';
          }
          break;
        case 3:
          if ((ref7 = row[6]) !== 10 && ref7 !== 13 && ref7 !== 14 && ref7 !== 20 && ref7 !== 30 && ref7 !== 99) {
            rowErrs['6'] = 'Ugyldig eksamenskode for høyere nivå';
          }
          break;
        default:
          if ((ref8 = row[6]) !== 30 && ref8 !== 99) {
            rowErrs['6'] = 'Ugyldig eksamenskode for uoppgitt nivå';
          }
      }
      males = 0;
      for (i = l = 7; l <= 12; i = ++l) {
        if (!(row[i] >= 0)) {
          rowErrs[i.toString()] = 'Kursdeltakere må være et postivt heltall';
        }
        males += row[i];
      }
      females = 0;
      for (i = m = 13; m <= 18; i = ++m) {
        if (!(row[i] >= 0)) {
          rowErrs[i.toString()] = 'Kursdeltakere må være et postivt heltall';
        }
        females += row[i];
      }
      if (!(males + females > 0)) {
        rowErrs['-2'] = 'Kurset må ha deltakere.';
      }
      if (!(row[19] >= 0)) {
        rowErrs['19'] = 'Antall menn med tilretteleggingstilskudd må være et positivt heltall';
      }
      if (!(row[19] <= males)) {
        rowErrs['19'] = 'Antall menn med tilretteleggingstilskudd skal ikke være større enn antall menn';
      }
      if (!(row[20] >= 0)) {
        rowErrs['20'] = 'Antall kvinner med tilretteleggingstilskudd må være et positivt heltall';
      }
      if (!(row[20] <= females)) {
        rowErrs['20'] = 'Antall kvinner med tilretteleggingstilskudd skal ikke være større enn antall kvinner';
      }
      startDate = validDate(row[21], new Date(REPORT_YEAR, 11, 31), new Date(REPORT_YEAR - 3, 0, 1));
      if (!startDate[0]) {
        rowErrs['21'] = 'Startdato ' + startDate[1];
      }
      endDate = validDate(row[22], new Date(REPORT_YEAR + 1, 1, 20), startDate[0] ? startDate[0] : new Date(REPORT_YEAR - 3, 0, 1));
      if (!endDate[0]) {
        rowErrs['22'] = 'Sluttdato ' + endDate[1];
      }
      if (!(row[23] >= 8)) {
        rowErrs['23'] = 'Kurset må ha minst 8 timer';
      }
      if (startDate[0] && endDate[0]) {
        if (!((Math.round(Math.abs((startDate[0].getTime() - endDate[0].getTime()) / 86400000)) + 1) * 24 >= row[23])) {
          rowErrs['23'] = 'Det er ikke ' + row[23] + ' timer innenfor kursets varighet.';
        }
      }
      if (!(row[24] >= 0)) {
        rowErrs['24'] = 'Timer med elektronisk kommunikasjon må være et positivt heltall.';
      }
      if (!(row[24] <= row[23] / 2)) {
        rowErrs['24'] = 'Fysiske samlinger skal utgjøre mer enn halvparten av totalt antall kurstimer.';
      }
      if (!row[25].toString().match(/^[123]$/)) {
        rowErrs['25'] = 'Ugyldig kode for tidspunkt';
      }
    }
    if (Object.keys(rowErrs).length) {
      row.unshift(rowErrs, line);
      return [false, row];
    } else {
      this.validator_seen_ids.push(row[3] + '@' + row[0]);
      return [true, row];
    }
  };

}).call(this);
