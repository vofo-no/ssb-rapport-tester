(function(){
	"use strict";

	var uploadApp = angular.module('uploadApp', ['tc.chartjs']);

	uploadApp
	.controller('FileController', ['$scope', '$http', function($scope, $http) {
		$scope.csvContent = {};
		$scope.courses = 0;
		$scope.csvFile = [];
		$scope.analyzing = false;
		$scope.progress = 0;
		$scope.kommuner = {};
		$scope.emnekoder = [101,102,103,104,105,106,107,108,109,110,111,112,199,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,230,231,232,233,234,298,299,301,302,303,304,305,306,307,308,398,399,401,402,403,404,405,406,407,408,409,410,499,501,502,503,504,505,506,507,508,599,601,602,603,604,605,606,607,608,609,610,611,612,698,699,701,702,703,704,705,706,720,721,722,723,724,799,801,802,803,899,901,902,903,904,905,906,907,908,909,910,911,912,998,999,1001,1002,1003,1004,1005,1006,1007,1020,1099,1101,1102,1103,1104,1105,1199];
		$scope.feilRader = [];
		$scope.kursRader = {};
		$scope.rapportYear = new Date().getFullYear();
		if (new Date().getMonth() < 4) $scope.rapportYear--;
		$scope.statusText = 'Åpner fila...';
		$scope.$watch('csvFile', function() {
      var kurs;
			if($scope.csvFile[0] === null) { return; }
			$scope.kursRader = {}; // Nullstill kursRader
			$scope.feilRader = []; // Nullstill feilRader
			$scope.courses = 0; // Nullstill courses
			$scope.courseDetails = {m: 0, k: 0, t: 0, org: {}}; // Nullstill courseDetails
			$scope.chart = {}; // Nullstill chart
			$scope.analyzing = true;
			for(var i=0;i<$scope.csvFile.length;i++) {
				kurs = $scope.csvFile[i];
				kurs.line = i+1;
				kurs.feil = [];
				kurs._feilfelt = {};
				if(typeof $scope.kursRader[kurs.kursId] === "undefined") {
					$scope.kursRader[kurs.kursId] = kurs;
					$scope.courses++;
				} else {
					kurs.feil = [{felt: "kursId", melding: "Kursets id er ikke unik."}];
          kurs._feilfelt.kursId=true;
					$scope.feilRader.push(kurs);
				}
			}
			/*
			//var arrayOfLines = $scope.csvFile.match(/^(?'stf_nummer'25\d{2});(?'organisasjon'\d{1,3}?);(?'kommune'\d{1,4});(?'kursid'\d{1,7});(?'emnekode'\d{3,4});(?'niva'1|2|3|9);(?'evaluering'10|11|12|13|14|20|30|40|99);(?'m1'\d*);(?'m2'\d*);(?'m3'\d*);(?'m4'\d*);(?'m5'\d*);(?'m6'\d*);(?'k1'\d*);(?'k2'\d*);(?'k3'\d*);(?'k4'\d*);(?'k5'\d*);(?'k6'\d*);(?'24m'\d*);(?'24k'\d*);(?'fra'\d{1,2}\.\d{1,2}\.\d{1,2});(?'til'\d{1,2}\.\d{1,2}\.\d{1,2});(?'timer'\d+);(?'el_timer'\d+);(?'tidspunkt'1|2|3);?$/gm);
			var kursRegExp = /^(25\d*);(\d*?);(\d*);(\d*);(\d*);(\d*);(\d*);(\d*);(\d*);(\d*);(\d*);(\d*);(\d*);(\d*);(\d*);(\d*);(\d*);(\d*);(\d*);(\d*);(\d*);(\d{1,2}\.\d{1,2}\.\d{1,2});(\d{1,2}\.\d{1,2}\.\d{1,2});(\d*);(\d*);(\d*);?$/;*/
			if($scope.kommuner.ok!=='aye') {
				$scope.statusText = "Henter kommuner fra Nasjonal vegdatabank....";
				$http({method: 'GET', url: 'https://www.vegvesen.no/nvdb/api/omrader/kommuner', headers: {Accept: 'application/vnd.vegvesen.nvdb-v1+json'}}).
					success(function(data) {
            var j;
						for(j=0;j<data.kommuner.length;j++) {
							$scope.kommuner[parseInt(data.kommuner[j].nummer)] = data.kommuner[j].navn;
						}
						console.log('Hentet %d kommuner fra NVDB.', data.kommuner.length);
						for(j=1;j<22;j++) {
							$scope.kommuner[j*100] = "Fylke " + j;
						}
						$scope.kommuner.ok = 'aye';
					}).
					error(function(err){
						console.log(err);
						$scope.analyzing = false;
						$scope.statusText = "Fikk ikke kontakt med Nasjonal vegdatabank. Sjekk internettforbindelsen din og prøv igjen.";
						return;
					});
			}
			$scope.statusText = "Analyserer kursene...";
      for(var key in $scope.kursRader){
        if($scope.kursRader.hasOwnProperty(key)){
          kurs = $scope.kursRader[key];
          //test org
          if(kurs.org !== '' && (kurs.org < 1 || kurs.org > 999)){
            kurs.feil.push({felt: "org", melding: "Organisasjon skal være et nummer mellom 1 og 999, eller blankt hvis studieforbundet selv arrangerer kurset."});
            kurs._feilfelt.org=true;
		  }
          //test kommunenummer
          if(typeof $scope.kommuner[kurs.kommune] === "undefined"){
            kurs.feil.push({felt: "kommune", melding: "Kommunenummeret " + kurs.kommune + " finnes ikke."});
            kurs._feilfelt.kommune=true;
		  }
          // test emnekode
          if(!isInArray(kurs.emnekode, $scope.emnekoder)) {
            kurs.feil.push({felt: "emnekode", melding: "Emnekode er ikke gyldig."});
            kurs._feilfelt.emnekode=true;
		  }
          //test nivå
          if(!isInArray(kurs.niva, [1,2,3,9])){
            kurs.feil.push({felt: "niva", melding: "Nivå skal være et nummer mellom 1 og 3 eller 9."});
            kurs._feilfelt.niva=true;
		  }
          //test evaluering
          if(!isInArray(kurs.evaluering, [10,11,12,13,14,20,30,40,99])){
            kurs.feil.push({felt: "evaluering", melding: "Evaluering skal enten være et nummer mellom 10 og 14 eller 20, 30, 40 eller 99. "});
            kurs._feilfelt.evaluering=true;
		  }
          //test deltakere
		  var menn = kurs.m1+kurs.m2+kurs.m3+kurs.m4+kurs.m5+kurs.m6;
		  var kvinner = kurs.k1+kurs.k2+kurs.k3+kurs.k4+kurs.k5+kurs.k6;
          if(menn+kvinner < 1){
            kurs.feil.push({felt: "deltakere", melding: "Kurset har ingen deltakere."});
            kurs._feilfelt.deltakere=true;
		  }
          // test tilrettelegging menn
          if(menn < kurs.m24) {
            kurs.feil.push({felt: "m24", melding: "Kurset har flere deltakere (menn) med tilretteleggingstilskudd enn deltakere totalt av dette kjønnet."});
            kurs._feilfelt.m24=true;
		  }
          // test tilrettelegging kvinner
          if(kvinner < kurs.k24){
            kurs.feil.push({felt: "k24", melding: "Kurset har flere deltakere (kvinner) med tilretteleggingstilskudd enn deltakere totalt av dette kjønnet."});
            kurs._feilfelt.k24=true;
		  }
          // test dato
          var fra = new Date(2000 + parseInt(kurs.fra.substr(6)),parseInt(kurs.fra.substr(3,2))-1,parseInt(kurs.fra.substr(0,2)),0,0,0,0);
          var til = new Date(2000 + parseInt(kurs.til.substr(6)),parseInt(kurs.til.substr(3,2))-1,parseInt(kurs.til.substr(0,2)),0,0,0,0);
          if(fra>til) {
            kurs.feil.push({felt: "fra", melding: "Kurset starter etter at det er slutt..."});
            kurs._feilfelt.fra=true;
		  }
          if(til.getFullYear()>$scope.rapportYear) {
            kurs.feil.push({felt: "til", melding: "Kurset må være avsluttet innen " + $scope.rapportYear + "."});
            kurs._feilfelt.til=true;
		  }
          // test el-timer
          if((kurs.timer<kurs.elTimer/2)){
            kurs.feil.push({felt: "elTimer", melding: "Timer med elektronisk kommunkiasjon kan ikke utgjøre mer enn 50% av kursets timer."});
            kurs._feilfelt.elTimer=true;
		  }
          //test tidspunkt
          if(!isInArray(kurs.tidspunkt, [1,2,3])) {
            kurs.feil.push({felt: "tidspunkt", melding: "Tidspunkt skal være et tall mellom 1 og 3."});
            kurs._feilfelt.tidspunkt=true;
		  }

          if(kurs.feil.length) {
            $scope.feilRader.push(kurs);
            delete $scope.kursRader[key];
            $scope.courses--;
          } else {
			$scope.courseDetails.m += menn;
			$scope.courseDetails.k += kvinner;
			$scope.courseDetails.t += kurs.timer;
			if($scope.courseDetails.org.hasOwnProperty(kurs.org || 0)) {
				$scope.courseDetails.org[kurs.org || 0] += kurs.timer;
			}
			else {
				$scope.courseDetails.org[kurs.org || 0] = kurs.timer;
			}

		  }
        }
      }
	  $scope.chart = {
		deltaker: {
			data: [
					{ value: $scope.courseDetails.m, color: '#46BFBD', highlight: '#5AD3D1', label: 'Menn' },
					{ value: $scope.courseDetails.k, color: '#F7464A', highlight: '#FF5A5E', label: 'Kvinner' },
				  ],
			options: {
				responsive: true,
				segmentShowStroke: true,
				segmentStrokeColor: '#fff',
				segmentStrokeWidth: 2,
				percentageInnerCount: 0,
				animationSteps: 100,
				animationEasing: 'easeOutBounce',
				animateRotate: true,
				animateScale: false,
				legendTemplate: ''
			  }
		}, timer: {
			data: {
				labels : Object.keys($scope.courseDetails.org),
				datasets: [
					{
						label: 'Timer',
						fillColor: '#F7464A',
						strokeColor: '#fff',
						highlightFill: '#FF5A5E',
						highlightStroke: '#fff',
						data: getValues($scope.courseDetails.org)
					}
				]
			},
			options: {
				responsive: true,
				scaleBeginAtZero : true,
				scaleShowGridLines : true,
				scaleGridLineColor : '#fff',
				scaleGridLineWidth : 1,
				showBarStroke: true,
				barStrokeWidth: 2,
				barValueSpacing: 2,
				barDatasetSpacing : 1,
				legendTemplate: ''
			}
		}
	  };
	  $scope.analyzing = false;
		});
	}])
	.directive("fileread", [function () {
		return {
			scope: false,
			link: function (scope, element, attributes) {
				element.bind("change", function (changeEvent) {
					var reader = new FileReader();
					reader.onload = function (loadEvent) {
						scope.$apply(function () {
							var headerRow = "stf;org;kommune;kursId;emnekode;niva;evaluering;m1;m2;m3;m4;m5;m6;k1;k2;k3;k4;k5;k6;m24;k24;fra;til;timer;elTimer;tidspunkt\n";
							Papa.parse(headerRow + loadEvent.target.result, {
								dynamicTyping: true,
								worker: true,
								header: true,
								complete: function(data) {
									scope.csvFile = data;
								}
							});
						});
					};
					reader.onprogress = function (progressEvent) {
						scope.$apply(function() {
							scope.progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
							scope.analyzing = true;
						});
					};
					reader.readAsText(changeEvent.target.files[0]);
				});
			}
		};
	}]);

	var getValues = function(arr) {
		var vals = [];
		for(var key in arr) {
			if(arr.hasOwnProperty(key)) vals.push(arr[key]);
		}
		return vals;
	};

	var isInArray = function(value, values) {
		for (var i=0;i<values.length;i++) {
			if(values[i]===value) return true;
		}
		return false;
	};
})();
