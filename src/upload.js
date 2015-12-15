(function() {
  $(function() {
    var REPORT_YEAR, errCount, errorList, makeCell, resetCounters, setStats, setStatus, showOutput, targetCount, valCount, validateRowHandler, validatorWorker;
    REPORT_YEAR = new Date().getFullYear();
    if (new Date().getMonth() < 4) {
      REPORT_YEAR--;
    }
    $('h1').text($('h1').text() + " " + REPORT_YEAR);
    errCount = 0;
    valCount = 0;
    targetCount = -1;
    resetCounters = function() {
      errCount = 0;
      valCount = 0;
      return targetCount = -1;
    };
    window.uploadData = {
      rows: [],
      errors: [],
      reset: function() {
        window.uploadData.rows = [];
        window.uploadData.errors = [];
        resetCounters();
        if (window.Worker) {
          return validatorWorker.postMessage([false]);
        } else {
          return validatorInit();
        }
      }
    };
    setStatus = function(txt) {
      return $('#analyzeStatus').text(txt || 'Ingen fil er valgt');
    };
    setStatus();
    showOutput = function() {
      var err, i, j, k, len, ref, ref1, row;
      $('#success, #errors').hide();
      if (window.uploadData.errors.length) {
        $('#errors tbody').empty();
        ref = window.uploadData.errors;
        for (j = 0, len = ref.length; j < len; j++) {
          err = ref[j];
          row = $('<tr />');
          for (i = k = 1, ref1 = err.length; 1 <= ref1 ? k < ref1 : k > ref1; i = 1 <= ref1 ? ++k : --k) {
            if (i < 28) {
              row.append(makeCell(err[i], err[0][i - 2]));
            }
          }
          row.append(makeCell(errorList(err[0]), true));
          $('#errors tbody').append(row);
        }
        return $('#errors').show();
      } else {
        if (valCount > 0) {
          return $('#success').fadeIn();
        }
      }
    };
    showOutput();
    setStats = function() {
      if (targetCount > -1 && valCount + errCount === targetCount) {
        showOutput();
        return $('#analyzeStatus2').text('Ferdig! Antall gyldige rader: ' + valCount + ' - antall med feil: ' + errCount);
      } else {
        return $('#analyzeStatus2').text('Analyserer... (' + Math.round(((valCount + errCount) / targetCount) * 100) + ' %) Antall gyldige rader: ' + valCount + ' - antall med feil: ' + errCount);
      }
    };
    makeCell = function(content, hasError) {
      return $("<td />").append(content).addClass(hasError ? 'danger' : 'success');
    };
    errorList = function(errors) {
      var key, li, list;
      list = $('<ul />');
      for (key in errors) {
        li = list.append($('<li />').text(errors[key]));
      }
      return list;
    };
    $('#fileInput').on('change', function(e) {
      var i;
      if (e.target.files[0] === void 0) {
        return;
      }
      window.uploadData.reset();
      showOutput();
      i = 0;
      setStatus('Leser fil...');
      $('#fileInput').prop('disabled', true);
      return Papa.parse(e.target.files[0], {
        worker: true,
        skipEmptyLines: true,
        step: function(row) {
          i++;
          return validateRowHandler(row.data[0], i);
        },
        complete: function() {
          setStatus('Fil innlest. Fant ' + i + ' rader.');
          $('#fileInput').prop('disabled', false);
          targetCount = i;
          if (!window.Worker) {
            return setStats();
          }
        }
      });
    });
    validatorWorker = new Worker(VALIDATOR_WORKER);
    if (window.Worker) {
      validatorWorker.onerror = function(e) {
        return console.log(e);
      };
      validatorWorker.onmessage = function(e) {
        if (e.data[0]) {
          valCount++;
          window.uploadData.rows.push(e.data[1]);
        } else {
          errCount++;
          window.uploadData.errors.push(e.data[1]);
        }
        return setStats();
      };
    }
    return validateRowHandler = function(row, line) {
      var result;
      if (window.Worker) {
        return validatorWorker.postMessage([row, line]);
      } else {
        result = validateRow(row, line);
        if (result[0]) {
          valCount++;
          window.uploadData.rows.push(result[1]);
        } else {
          errCount++;
          window.uploadData.errors.push(result[1]);
        }
        return setStats();
      }
    };
  });

}).call(this);
