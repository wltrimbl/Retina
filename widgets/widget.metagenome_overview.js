(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Overview Widget",
                name: "metagenome_overview",
                author: "Tobias Paczian",
                requires: [ "rgbcolor.js" ]
        }
    });
    
    widget.setup = function () {
	    return [ Retina.add_renderer({"name": "paragraph", "resource": "./renderers/",  "filename": "renderer.paragraph.js" }),
		         Retina.load_renderer("paragraph"),
		         Retina.add_renderer({"name": "graph", "resource": "./renderers/",  "filename": "renderer.graph.js" }),
		         Retina.load_renderer("graph")
	           ];
    };
    
    widget.display = function (wparams) {
	// check if required data is loaded
	    if (! (stm.DataStore.hasOwnProperty('metagenome') && stm.DataStore.metagenome.hasOwnProperty(wparams.id))) {
	        // make a promise list
	        var stats_promises = [];
	        stats_promises.push(stm.get_objects({ "type": "metagenome", "id": wparams.id, "options": { "verbosity": "full" } }));
	        stats_promises.push(stm.get_objects({ "type": "metagenome_statistics", "id": wparams.id, "options": { "verbosity": "full" } }));
	        jQuery.when.apply(this, stats_promises).then(function() {
		        widget.display(wparams);
	        });
	        return;
	    }

	    // make some shortcuts
	    var mg = stm.DataStore.metagenome[wparams.id];
	    var mg_stats = stm.DataStore.metagenome_statistics[wparams.id];
	    var content = wparams.target;

	    // empty the output area
	    content.innerHTML = "";
	
	    // set style variables
	    var header_color = "black";
	    var title_color = "black";
	    var outputs = [ 
	        { type: 'paragraph', data: 'general_overview' },
	        { type: 'paragraph', data: 'metagenome_summary' },
	        { type: 'piechart', data: 'summary', category: 'summary' },
	        { type: 'paragraph', data: 'piechart_footnote' },
	        { type: 'paragraph', data: 'project_information' },
	        { type: 'paragraph', data: 'analysis_statistics' },
	        { type: 'paragraph', data: 'ontology_introtext' },
	        { type: 'piechart', data: 'COG', category: 'ontology' },
	        { type: 'piechart', data: 'KO', category: 'ontology' },
	        { type: 'piechart', data: 'NOG', category: 'ontology' },
	        { type: 'piechart', data: 'Subsystems', category: 'ontology' },
	        { type: 'paragraph', data: 'taxonomy_introtext' },
	        { type: 'piechart', data: 'domain', category: 'taxonomy' },
	        { type: 'piechart', data: 'phylum', category: 'taxonomy' },
	        { type: 'piechart', data: 'class', category: 'taxonomy' },
	        { type: 'piechart', data: 'order', category: 'taxonomy' },
	        { type: 'piechart', data: 'family', category: 'taxonomy' },
	        { type: 'piechart', data: 'genus', category: 'taxonomy' }
	    ];
	
	    // iterate over the outputs
	    for (out=0;out<outputs.length;out++) {
	        // create and append the output div
	        var div = document.createElement('div');
	        content.appendChild(div);
	    
	        // check the type and call the according renderer with the data generated by the defined function
	        switch (outputs[out].type) {
	            case 'paragraph':
		            var data = widget[outputs[out].data](mg, mg_stats);
		            if (data) {
		                data.target = div;
		                data.title_color = title_color;
		                data.header_color = header_color;
		                Retina.Renderer.create("paragraph", data).render();
	                }
		            break;
	            case 'piechart':
	                var data;
	                if (outputs[out].data == 'summary') {
	                    data = widget.summary_piechart(mg, mg_stats);
	                } else {
	                    data = widget.annotation_piechart(mg_stats, outputs[out].category, outputs[out].data);
	                }
		            div.setAttribute('class', 'span12');
		            data.target = div;
		            Retina.Renderer.create("graph", data).render();
		            break;
		        case 'barchart':
		            var data = widget.annotation_barchart(mg_stats, outputs[out].category, outputs[out].data);
		            div.setAttribute('class', 'span12');
		            data.target = div;
		            Retina.Renderer.create("graph", data).render();
		            break;
		        default:
		            break;
	        }
	    }
    };
    
    widget.general_overview = function (mg, mg_stats) {
	    // general overview
	    var ncbi_id;
	    try {
	        ncbi_id = mg.metadata.project.data.ncbi_id;
	        ncbi_id = "<a href='http://www.ncbi.nlm.nih.gov/genomeprj/"+ncbi_id+"'>"+ncbi_id+"</a>";
	    } catch (err) {
	        ncbi_id = "-";
	    }
	    var gold_id;
	    try {
 	        gold_id = mg.metadata.library.data.gold_id;
	        gold_id = "<a href='http://www.ncbi.nlm.nih.gov/genomeprj/"+gold_id+"'>"+gold_id+"</a>";
	    } catch (err) {
	        gold_id = "-";
	    }
	    var pubmed_id;
	    try {
 	        pubmed_id = mg.metadata.library.data.pubmed_id.split(", ");
	        var pm = [];
	        for (i=0;i<pubmed_id.length;i++) {
		        pm.push("<a href='http://www.ncbi.nlm.nih.gov/pubmed/"+pubmed_id[i]+"'>"+pubmed_id[i]+"</a>");
	        }
	        pubmed_id = pm.join(", ");
	    } catch (err) {
	        pubmed_id = "-";
	    }
	    var pi_link;
	    try {
	        pi_link = "<a href='mailto:"+mg.metadata.project.data.PI_email+"'>"+mg.metadata.project.data.PI_firstname+" "+mg.metadata.project.data.PI_lastname+"</a>";
	    } catch (err) {
	        pi_link = "-";
	    }
	    var organization;
	    try {
	        organization = mg.metadata.project.data.PI_organization;
	    } catch (err) {
	        organization = "-";
	    }
	    var data = { data:
	           [ { title: "Metagenome Data Sheet for ID " + mg.id.substring(3)},
		     { table: [ [ { header: "Metagenome Name" }, mg.name, { header: "NCBI Project ID" }, ncbi_id ],
				[ { header: "PI" }, pi_link, { header: "GOLD ID" }, gold_id ],
				[ { header: "Organization" }, organization, { header: "PubMed ID" }, pubmed_id ],
				[ { header: "Visibility" }, mg.status ],
				//[ { header: "Static Link" }, "<a href='http://metagenomics.anl.gov/linkin.cgi?metagenome="+mg.id.substring(3)+"'>http://metagenomics.anl.gov/linkin.cgi?metagenome="+mg.id.substring(3)+"</a>" ]
                              ] }
		   ] };
	return data;
    };
    
    widget.metagenome_summary = function(mg, mg_stats) {
	    // hash the basic stats
	    var stats  = mg_stats.sequence_stats;
	    var fuzzy  = widget._summary_fuzzy_math(mg, mg_stats);
	    var is_rna = (mg.sequence_type == 'Amplicon') ? 1 : 0;
	    var total  = parseInt(stats['sequence_count_raw']);
        var ptext  = " Of the remainder, "+fuzzy[3].formatString()+" sequences ("+widget._to_per(fuzzy[3], total)+") contain predicted proteins with known functions and "+fuzzy[2].formatString()+" sequences ("+widget._to_per(fuzzy[2], total)+") contain predicted proteins with unknown function.";
        var ftext  = " "+fuzzy[1].formatString()+" sequences ("+widget._to_per(fuzzy[1], total)+") have no rRNA genes"+(is_rna ? '.' : " or predicted proteins");
	    var data = { data:
	            [ { header: "Metagenome Summary" },
		          { p: "The dataset "+mg.name+" was uploaded on "+mg.created+" and contains "+total.formatString()+" sequences totaling "+parseInt(stats['bp_count_raw']).formatString()+" basepairs with an average length of "+parseInt(stats['average_length_raw']).formatString()+" bps. The piechart below breaks down the uploaded sequences into "+(is_rna ? '3' : '5')+" distinct categories." },
		          { p: fuzzy[0].formatString()+" sequences ("+widget._to_per(fuzzy[0], total)+") failed to pass the QC pipeline. Of the sequences that passed QC, "+fuzzy[4].formatString()+" sequences ("+widget._to_per(fuzzy[4], total)+") contain ribosomal RNA genes."+(is_rna ? '' : ptext)+ftext },
		          { p: "The analysis results shown on this page are computed by MG-RAST. Please note that authors may upload data that they have published their own analysis for, in such cases comparison within the MG-RAST framework can not be done." }
		        ] };
	    return data;
    };

    widget.summary_piechart = function(mg, mg_stats) {
	    var pieData = [];
	    var pieNums = widget._summary_fuzzy_math(mg, mg_stats);
	    var legend  = ["Failed QC", "Unknown", "Unknown Protein", "Annotated Protein", "ribosomal RNA"];
	    var colors  = ["#6C6C6C", "#dc3912", "#ff9900", "#109618", "#3366cc", "#990099"];
	    for (var i = 0; i < pieNums.length; i++) {
	        pieData.push({ name: legend[i], data: [ parseInt(pieNums[i]) ], fill: colors[i] });
	    }
	    var data = { 'title': 'Sequence Breakdown',
	                 'type': 'pie',
		             'title_settings': { 'font-size': '18px', 'font-weight': 'bold', 'x': 0, 'text-anchor': 'start' },
		             'x_labels': [ " " ],		     
		             'show_legend': true,
		             'legend_position': 'right',
		             'width': 700,
		             'height': 350,
		             'data': pieData };
	    return data;
    };
    
    widget._summary_fuzzy_math = function(mg, mg_stats) {
        // get base numbers
        var stats  = mg_stats.sequence_stats;
        var is_rna = (mg.sequence_type == 'Amplicon') ? 1 : 0;
        var raw_seqs    = ('sequence_count_raw' in stats) ? parseFloat(stats.sequence_count_raw) : 0;
        var qc_seqs     = ('sequence_count_preprocessed' in stats) ? parseFloat(stats.sequence_count_preprocessed) : 0;
        var rna_sims    = ('sequence_count_sims_rna' in stats) ? parseFloat(stats.sequence_count_sims_rna) : 0;
        var r_clusts    = ('cluster_count_processed_rna' in stats) ? parseFloat(stats.cluster_count_processed_rna) : 0;
        var r_clust_seq = ('clustered_sequence_count_processed_rna' in stats) ? parseFloat(stats.clustered_sequence_count_processed_rna) : 0;
        var ann_reads   = ('read_count_annotated' in stats) ? parseFloat(stats.read_count_annotated) : 0;
        var aa_reads    = ('read_count_processed_aa' in stats) ? parseFloat(stats.read_count_processed_aa) : 0;
        // first round math
        var qc_fail_seqs  = raw_seqs - qc_seqs;
        var ann_rna_reads = rna_sims ? (rna_sims - r_clusts) + r_clust_seq : 0;
        var ann_aa_reads  = (ann_reads && (ann_reads > ann_rna_reads)) ? ann_reads - ann_rna_reads : 0;
        var unkn_aa_reads = aa_reads - ann_aa_reads;
        var unknown_all   = raw_seqs - (qc_fail_seqs + unkn_aa_reads + ann_aa_reads + ann_rna_reads);
        // fuzzy math
        if (is_rna) {
            qc_fail_seqs  = raw_seqs - qc_rna_seqs;
            unkn_aa_reads = 0;
            ann_aa_reads  = 0;
            unknown_all   = raw_seqs - (qc_fail_seqs + ann_rna_reads);
        } else {
            if (unknown_all < 0) { unknown_all = 0; }
            if (raw_seqs < (qc_fail_seqs + unknown_all + unkn_aa_reads + ann_aa_reads + ann_rna_reads)) {
      	        var diff = (qc_fail_seqs + unknown_all + unkn_aa_reads + ann_aa_reads + ann_rna_reads) - raw_seqs;
      	        unknown_all = (diff > unknown_all) ? 0 : unknown_all - diff;
            }
            if ((unknown_all == 0) && (raw_seqs < (qc_fail_seqs + unkn_aa_reads + ann_aa_reads + ann_rna_reads))) {
      	        var diff = (qc_fail_seqs + unkn_aa_reads + ann_aa_reads + ann_rna_reads) - raw_seqs;
      	        unkn_aa_reads = (diff > unkn_aa_reads) ? 0 : unkn_aa_reads - diff;
            }
            // hack to make MT numbers add up
            if ((unknown_all == 0) && (unkn_aa_reads == 0) && (raw_seqs < (qc_fail_seqs + ann_aa_reads + ann_rna_reads))) {
      	        var diff = (qc_fail_seqs + ann_aa_reads + ann_rna_reads) - raw_seqs;
      	        ann_rna_reads = (diff > ann_rna_reads) ? 0 : ann_rna_reads - diff;
            }
        }
        return [ qc_fail_seqs, unknown_all, unkn_aa_reads, ann_aa_reads, ann_rna_reads ];
    };
    
    widget.piechart_footnote = function(mg, mg_stats) {
	    return { data: [ { footnote: { title: "Note:", text: "Sequences containing multiple predicted features are only counted in one category. Currently downloading of sequences via chart slices is not enabeled." } } ], width: 'span8' };
    };
    
    widget.ontology_introtext = function(mg, mg_stats) {
	    return { style: "clear: both",
	             data: [ { header: "Functional Category Hits Distribution" },
			             { p: "The pie charts below illustrate the distribution of functional categories for COGs, KOs, NOGs, and Subsystems at the highest level supported by these functional hierarchies. Each slice indicates the percentage of reads with predicted protein functions annotated to the category for the given source. " } ] };
    };
    
    widget.taxonomy_introtext = function(mg, mg_stats) {
	    return { data: [ { header: "Taxonomic Hits Distribution" },
			             { p: "The pie charts below illustrate the distribution of taxonomic domains, phyla, and orders for the annotations. Each slice indicates the percentage of reads with predicted proteins and ribosomal RNA genes annotated to the indicated taxonomic level. This information is based on all the annotation source databases used by MG-RAST." } ] };
    };
    
    widget.project_information = function(mg) {
        try {
	        return { width: "span6",
	                 data: [ { header: "Project Information" },
			                 { p: "This metagenome is part of the project "+mg.metadata.project.name },
			                 { p: mg.metadata.project.data.project_description }
			               ] };
		} catch (err) {
            return null;
	    }
    };
    
    widget.annotation_piechart = function(mg_stats, dcat, dtype) {
        var pieData = [];
        var annData = mg_stats[dcat][dtype];
        var colors  = GooglePalette(annData.length);
        var annMax  = 0;
        var annSort = annData.sort(function(a,b) {
            return b[1] - a[1];
        });        
        for (var i = 0; i < annSort.length; i++) {
    	    pieData.push({ name: annSort[i][0], data: [ parseInt(annSort[i][1]) ], fill: colors[i] });
    	    annMax = Math.max(annMax, annSort[i][0].length);
    	}
    	var pwidth  = 300;
    	var pheight = 300;
    	var lwidth  = Math.max(300, annMax*7.5);
    	var lheight = pieData.length * 23;
    	var width   = pwidth+lwidth;
    	var height  = (lheight > pheight) ? Math.min(lheight, pheight+(pheight/2)) : pheight;
    	var data = { 'title': dtype,
    	             'type': 'pie',
    		         'title_settings': { 'font-size': '18px', 'font-weight': 'bold', 'x': 0, 'text-anchor': 'start' },
    		         'x_labels': [""],
    		         'show_legend': true,
    		         'legendArea': [pwidth+40, 20, lwidth, lheight],
    		         'chartArea': [25, 20, pwidth, pheight],
    		         'width': width,
    		         'height': height,
    		         'data': pieData };
    	return data;
    };

    widget.annotation_barchart = function(mg_stats, dcat, dtype) {
        var barData = [];
        var annData = mg_stats[dcat][dtype];
        var colors = GooglePalette(annData.length);
        var total = 0;
    	var max = 0;
    	for (var i = 0; i < annData.length; i++) {
    	    if (parseInt(annData[i][1]) > max) { max = parseInt(annData[i][1]); }
    	    total += parseInt(annData[i][1]);
    	}
    	for (var j = 0; j < annData.length; j++) {
    	    barData.push({ name: annData[j][0], data: [ parseFloat(parseInt(annData[j][1]) / max * 100).toFixed(2) ], fill: colors[j] });
    	}
    	var data = { 'title': dtype,
    		         'type': 'column',
    		         'title_settings': { 'font-size': '18px', 'font-weight': 'bold', 'x': 0, 'text-anchor': 'start' },
    		         'x_labels': [ "Distribution" ],		     
    		         'show_legend': true,
    		         'show_grid': true,
    		         'legend_position': 'left',
    		         'width': 700,
    		         'height': 350,
    		         'data': barData };
    	return data;
    };

    widget.analysis_statistics = function(mg, mg_stats) {
        stats = mg_stats.sequence_stats;
	    return { width: "span6",
		         style: "float: left; margin-top: -20px;",
		         data: [ { header: "Analysis Statistics" },
			             { fancy_table: { data: [
			                 [ { header: "Upload: bp Count" }, widget._to_num('bp_count_raw', stats)+" bp" ],
			                 [ { header: "Upload: Sequences Count" }, widget._to_num('sequence_count_raw', stats) ],
			                 [ { header: "Upload: Mean Sequence Length" }, widget._to_num('average_length_raw', stats)+" ± "+widget._to_num('standard_deviation_length_raw', stats)+" bp" ],
			                 [ { header: "Upload: Mean GC percent" }, widget._to_num('average_gc_content_raw', stats)+" ± "+widget._to_num('standard_deviation_gc_content_raw', stats)+" %" ],
			                 [ { header: "Artificial Duplicate Reads: Sequence Count" }, widget._to_num('sequence_count_dereplication_removed', stats) ],
			                 [ { header: "Post QC: bp Count" }, widget._to_num('bp_count_preprocessed', stats)+" bp" ],
			                 [ { header: "Post QC: Sequences Count" }, widget._to_num('sequence_count_preprocessed', stats) ],
			                 [ { header: "Post QC: Mean Sequence Length" }, widget._to_num('average_length_preprocessed', stats)+" ± "+widget._to_num('standard_deviation_length_preprocessed', stats)+" bp" ],
			                 [ { header: "Post QC: Mean GC percent" }, widget._to_num('average_gc_content_preprocessed', stats)+" ± "+widget._to_num('standard_deviation_gc_content_preprocessed', stats)+" %" ],
			                 [ { header: "Processed: Predicted Protein Features" }, widget._to_num('sequence_count_processed_aa', stats) ],
			                 [ { header: "Processed: Predicted rRNA Features" }, widget._to_num('sequence_count_processed_rna', stats) ],
			                 [ { header: "Alignment: Identified Protein Features" }, widget._to_num('sequence_count_sims_aa', stats) ],
			                 [ { header: "Alignment: Identified rRNA Features" }, widget._to_num('sequence_count_sims_rna', stats) ],
			                 [ { header: "Annotation: Identified Functional Categories" }, widget._to_num('sequence_count_ontology', stats) ]
			                 ] } }
			            ] };
    };
    
    widget._to_per = function(n, d) {
        return (parseInt(n) / parseInt(d) * 100).formatString(1) + "%";
    };
    
    widget._to_num = function(key, obj) {
        var num = (key in obj) ? obj[key] : 0;
        return parseInt(num).formatString();
    };
    
})();