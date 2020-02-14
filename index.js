var slider = d3.select('#ui').append('input').attr('class', 'input-range');
var tooltip = d3.select('body').append('div').attr('class', 'tooltip').style('opacity', 0);
var format = d3.format(',');
var maxValue = 50000;
var minValue = 200;
var label = d3.select('#ui').append('div');
var labelFormat = function(s) {
	return s.replace(/\/20/, '');
};

var cast = function(d) {
	Object.keys(d).forEach(function(key) {
		if (d[key] && !isNaN(+d[key])) d[key] = +d[key];
		if (!d[key] && d[key] === '') d[key] = 0;
	});

	if (d['Country/Region'] === 'United Arab Emirates') d['Country/Region'] = 'UAE';
	return d;
};

var p1 = d3.csv('data/time_series_2019-ncov-Confirmed.csv', cast);
var p2 = d3.csv('data/time_series_2019-ncov-Recovered.csv', cast);
var p3 = d3.csv('data/time_series_2019-ncov-Deaths.csv', cast);

Promise.all([ p1, p2, p3 ]).then(function(data) {
	var dateSeries = Object.keys(data[0][0]).filter(function(d) {
		return new Date(d).toString() != 'Invalid Date';
	});

	slider
		.attr('type', 'range')
		.attr('min', 0)
		.attr('max', dateSeries.length - 1)
		.attr('step', 1)
		.attr('value', dateSeries.length - 1)
		.style('width', '98%');

	label.text(labelFormat(dateSeries[dateSeries.length - 1]));

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
		if (confi.length > 1) {
			var nnConfi = d3
				.nest()
				.key(function(d) {
					return d['Province/State'];
				})
				.map(confi);
			var nnRecov = d3
				.nest()
				.key(function(d) {
					return d['Province/State'];
				})
				.map(recov);
			var nnDeath = d3
				.nest()
				.key(function(d) {
					return d['Province/State'];
				})
				.map(death);

			var nnkeys = d3.set(nnConfi.keys().concat(nnRecov.keys().concat(nnDeath.keys()))).values();

			return {
				name: key,
				cityValue: nnkeys.map(function(nnkey) {
					var nnconfi = nnConfi.get(nnkey);
					var nnrecov = nnRecov.get(nnkey);
					var nndeath = nnDeath.get(nnkey);
					return { name: nnkey, confirmed: nnconfi[0], recovered: nnrecov[0], death: nndeath[0] };
				})
			};
		} else {
			return {
				name: confi[0]['Province/State'] || key,
				confirmed: confi[0],
				recovered: recov[0],
				death: death[0]
			};
		}
	});

	var citys = sumData.filter(function(d) {
		return d.cityValue;
	});

	var countrys = sumData.filter(function(d) {
		return !d.cityValue;
	});

	citys.sort(function(a, b) {
		return b.cityValue.length - a.cityValue.length;
	});

	const draw = function(date) {
		citys.forEach(function(c) {
			drawBarchart(c.cityValue, date, c.name);
		});

		drawBarchart(countrys, date, null);
	};

	draw(dateSeries[dateSeries.length - 1]);

	slider.on('input', function() {
		label.text(labelFormat(dateSeries[this.value]));
		d3.select('#stage1').html('');
		d3.select('#stage2').html('');

		draw(dateSeries[this.value]);
	});
});

function drawBarchart(rdata, dateSeries, country) {
	var stage = country == 'Mainland China' ? d3.select('#stage1') : d3.select('#stage2');
	var height = (rdata.length + 4) * 20;

	var confirmed = rdata
		.map(function(d) {
			return { name: d.name, type: 'confirmed', date: dateSeries, value: d.confirmed[dateSeries] };
		})
		.sort(function(a, b) {
			return a.value - b.value;
		});
	var recovered = rdata.map(function(d) {
		return { name: d.name, type: 'recovered', date: dateSeries, value: d.recovered[dateSeries] };
	});
	var death = rdata.map(function(d) {
		return { name: d.name, type: 'death', date: dateSeries, value: d.death[dateSeries] };
	});

	var maxDomain = country == 'Mainland China' ? maxValue : minValue;

	var data = confirmed.concat(recovered.concat(death));

	var chart = nChart
		.createHGroupBarChart()
		.plotMargin({ top: 40, left: 140, bottom: 10, right: 60 })
		.x(function(d) {
			return d['value'];
		})
		.xScaleDomain([ 0, maxDomain ])
		.y(function(d) {
			return d['name'];
		})
		.group(function(d) {
			return d['type'];
		})
		.scalePaddingInner(0.1)
		.scalePaddingOuter(0.5);

	var axis = nChart.createAxis().topAxis(true).bottomAxis(false).xAxisGridVisible(true).xTickSize(4).yTickSize(4);

	var selector = stage.append('div');

	selector.append('h2').text(country || 'Other');

	selector.append('div').style('height', height).attr('class', 'chart ' + country).datum(data).call(chart).call(axis);

	selector
		.select('.plotLayer')
		.selectAll('.bar')
		.on('mouseover', function(d) {
			var html = '';

			html += '<span>' + d.name + '</span>';
			html += '<span class="value">' + d.type + '</span>';
			html += '<span>' + format(d.value) + '</>';

			tooltip.attr('class', 'tooltip ' + d.type);
			tooltip.transition().duration(200).style('opacity', 1);
			tooltip.html(html).style('left', d3.event.pageX + 10 + 'px').style('top', d3.event.pageY - 28 + 'px');
		})
		.on('mouseout', function(d) {
			tooltip.transition().duration(500).style('opacity', 0);
		});
}
