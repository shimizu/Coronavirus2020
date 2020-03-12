var stage = d3.select("#stage");
var tooltip = d3.select('body').append('div').attr('class', 'tooltip').style('opacity', 0);
var format = d3.format(',');
var maxValue = 70000;
var minValue = 8000;
var tickArray = []
var labelFormat = function(s) {
	return s.replace(/\/20/, '');
};

var cast = function(d) {
	Object.keys(d).forEach(function(key) {
		if (d[key] && !isNaN(+d[key])) d[key] = +d[key];
		if (!d[key] && d[key] === '') d[key] = 0;
	});

	return d;
};

var p1 = d3.csv('data/time_series_19-covid-Confirmed.csv', cast);
var p2 = d3.csv('data/time_series_19-covid-Recovered.csv', cast);
var p3 = d3.csv('data/time_series_19-covid-Deaths.csv', cast);
var p4 = d3.tsv('data/namelist.tsv');

Promise.all([ p1, p2, p3, p4 ]).then(function(data) {


	var names = d3
		.nest()
		.rollup(function(d) {
			return d[0];
		})
		.key(function(d) {
			return d.EN.trim();
		})
		.map(data[3]);

	var dateSeries = Object.keys(data[0][0]).filter(function(d) {
		return new Date(d).toString() != 'Invalid Date';
	});

	tickArray = dateSeries.filter(function(l, i){ return i % 3 == 0 })

	var nConfi = d3
		.nest()
		.key(function(d) {
			return d['Country/Region'];
		})
		.map(data[0]);
	var nRecov = d3
		.nest()
		.key(function(d) {
			return d['Country/Region'];
		})
		.map(data[1]);
	var nDeath = d3
		.nest()
		.key(function(d) {
			return d['Country/Region'];
		})
		.map(data[2]);

	var keys = d3.set(nConfi.keys().concat(nRecov.keys().concat(nDeath.keys()))).values();

	var sumData = keys.map(function(key) {
		var confi = nConfi.get(key);
		var recov = nRecov.get(key);
		var death = nDeath.get(key);

		if(confi.length > 1){
			//console.log(key, confi)
			var tmpConfi = {};
			confi.forEach(function(con){
				dateSeries.forEach(function(date){
					if(!tmpConfi[date]) tmpConfi[date]  = 0;
					tmpConfi[date] += con[date]
				});
			})
			tmpConfi = Object.keys(tmpConfi).map(function(k){ return {"date":k,"type":"Confirmed", "value":tmpConfi[k]} } );

			var tmpRecov = {};
			recov.forEach(function(con){
				dateSeries.forEach(function(date){
					if(!tmpRecov[date]) tmpRecov[date]  = 0;
					tmpRecov[date] += con[date]
				});
			})
			tmpRecov = Object.keys(tmpRecov).map(function(k){ return {"date":k,"type":"Recovered", "value":tmpRecov[k]} } );			


			var tmpDeath = {};
			death.forEach(function(con){
				dateSeries.forEach(function(date){
					if(!tmpRecov[date]) tmpDeath[date]  = 0;
					tmpDeath[date] += con[date]
				});
			})
			tmpDeath = Object.keys(tmpDeath).map(function(k){ return {"date":k,"type":"death", "value":tmpDeath[k]} } );			

			tmpConfi.reduce(function(acc, cur, i){
				if(i === 1) acc.diff = acc.value;	
				cur.diff = cur.value - acc.value 
				return cur;
			});				
			tmpRecov.reduce(function(acc, cur, i){
				if(i === 1) acc.diff = acc.value;	
				cur.diff = cur.value - acc.value 
				return cur;
			});	
			tmpDeath.reduce(function(acc, cur, i){
				if(i === 1) acc.diff = acc.value;	
				cur.diff = cur.value - acc.value 
				return cur;
			});			

			var matchName = names.get(key.trim())
			return {
				key:  (matchName) ? matchName.JP :  key ,
				confSum:d3.max(tmpConfi, function(d){ return  d.value }),
				values: [tmpConfi, tmpRecov, tmpDeath ].flat()
			};
;

		}else{
			var tmpConfi = dateSeries.map(function(k){ return {"date":k, "type":"Confirmed", "value":confi[0][k]} });
			var tmpRecov = dateSeries.map(function(k){ return {"date":k, "type":"Recovered", "value":recov[0][k]} });
			var tmpDeath = dateSeries.map(function(k){ return {"date":k, "type":"death", "value":death[0][k]} });
			
			tmpConfi.reduce(function(acc, cur, i){
				if(i === 1) acc.diff = acc.value;	
				cur.diff = cur.value - acc.value 
				return cur;
			});				
			tmpRecov.reduce(function(acc, cur, i){
				if(i === 1) acc.diff = acc.value;	
				cur.diff = cur.value - acc.value 
				return cur;
			});	
			tmpDeath.reduce(function(acc, cur, i){
				if(i === 1) acc.diff = acc.value;	
				cur.diff = cur.value - acc.value 
				return cur;
			});				
			var matchName = names.get(key.trim())
			return {
				key: (matchName) ? matchName.JP :  key ,
				confSum:d3.max(tmpConfi, function(d){ return  d.value }),
				values: [tmpConfi, tmpRecov, tmpDeath ].flat()

			};
		}

	});

	sumData.sort(function(a,b){return b.confSum - a.confSum})
	sumData.filter(function(d){ return d.confSum > 10}).forEach(function(countryData){
		drawBarchart(countryData);
	});
		

});

function drawBarchart(countryData) {
	//console.log(countryData.key, countryData)

	var confSum = countryData.confSum;
	var domain = [0, 10];
	if(confSum > 10) domain = [0, 100];
	if(confSum > 100) domain = [0, 500];
	if(confSum > 500) domain = [0, 1000];
	if(confSum > 1000) domain = [0, 5000];
	if(confSum > 5000) domain = [0, 20000];

	if(confSum > 20000) domain = [0, 30000];
	if(confSum > 30000) domain = [0, 40000];
	if(confSum > 40000) domain = [0, 50000];
	if(confSum > 50000) domain = [0, 60000];
	if(confSum > 60000) domain = [0, 70000];
	if(confSum > 70000) domain = [0, 80000];
	if(confSum > 80000) domain = [0, 90000];
	if(confSum > 90000) domain = [0, 100000];

	var data = countryData.values;

	var chartArea = stage.append("div")
	chartArea.append("h1").text(countryData.key)
	
	var chartBody = chartArea.append("div").attr("class", "chart")

		
		var chart = nChart.createVGroupBarChart()
			.plotMargin({top:20, left:80, bottom:20, right:80})
			.x(function(d){ return d["date"] })
			.y(function(d){ return d["value"] })
			.yScaleDomain(domain)
			.group(function(d){ return d["type"] })
			.scalePaddingInner(0.1)
			.scalePaddingOuter(0)
	
			
		var axis = nChart.createAxis()
			.yAxisGridVisible(true)        
			.xTickSize(5)
			.xTickValues(tickArray)
			.xTickSizeInner(8)
			.xTickSizeOuter(0)
			.yTickFormat(function(t){ return format(t)})
			.xTickFormat(function(t){ return labelFormat(t) });			


		var selector = chartBody
			.datum(data)
			.call(chart)
			.call(axis)


		selector
			.select('.plotLayer')
			.selectAll('.bar')
			.on('mouseover', function(d) {
				var html = '';
	
				console.log(d)
				html += '<div>' + labelFormat(d.date) + '</div>';
				html += '<div>' + d.type + '</div>';
				html += "<div>";
				html += '<span>新規：</span><span>' + format(d.value) + '</span>';
				html += "</div>";
				html += "<div>";
				html += '<span>累計：</span><span>' + format(d.diff) + '</span>';
				html += "</div>";
	
				tooltip.attr('class', 'tooltip ' + d.type);
				tooltip.transition().duration(200).style('opacity', 1);
				tooltip.html(html).style('left', d3.event.pageX + 10 + 'px').style('top', d3.event.pageY - 28 + 'px');
			})
			.on('mouseout', function(d) {
				//tooltip.transition().duration(500).style('opacity', 0);
			});			
}
