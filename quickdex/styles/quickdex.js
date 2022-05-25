let yourOptions = {

  // Sheet Information
  sheetID: "1l_F95Zhyj5OPQ0zs-54pqacO6bVDiH4rlh16VhPNFUc",
  sheetPage: "Public Masterlist",

};


/* ==================================================================== */
/* Charadex
======================================================================= */
const charadex = (options) => {

  /* ==================================================================== */
  /* Importing Your Options
  ======================================================================= */
  let userOptions = options;


  /* ==================================================================== */
  /* URL
  ======================================================================= */
  let url = new URL(window.location.href);
  const urlParams = new URLSearchParams(window.location.search);


  /* ==================================================================== */
  /* Sifting Through Options
  ======================================================================= */
  const charadexInfo = {
    sheetID: 
      (userOptions.sheetID.includes('/d/')) 
      ? userOptions.sheetID.split('/d/')[1].split('/edit')[0] 
      : userOptions.sheetID 
      || "1l_F95Zhyj5OPQ0zs-54pqacO6bVDiH4rlh16VhPNFUc",
    sheetPage: userOptions.sheetPage || "Public Masterlist",
    itemAmount: userOptions.itemAmount || 12,
    itemOrder: userOptions.itemOrder || "desc",
    searchParams: userOptions.searchParams || ['id', 'owner', 'artist', 'designer'],
  };


  /* ==================================================================== */
  /* Clean Sheet Data
  ======================================================================= */
  const scrubData = (sheetData) => {

    const scrubbedData = [];
    cleanJson = JSON.parse(sheetData.substring(47).slice(0, -2));

    const col = [];
    if (cleanJson.table.cols[0].label) {
      cleanJson.table.cols.forEach((headers) => {
        if (headers.label) {
          col.push(headers.label.toLowerCase().replace(/\s/g, "-"));
        }
      });
    }

    cleanJson.table.rows.forEach((info) => {
      const row = {};
      const isBoolean = val => 'boolean' === typeof val;
      col.forEach((ele, ind) => {
        row[ele] = info.c[ind] != null ? info.c[ind].f != null && !isBoolean(info.c[ind].v) ? info.c[ind].f : info.c[ind].v != null ? info.c[ind].v : "" : "";
      });
      scrubbedData.push(row);
    });

    return scrubbedData;

  }


  /* ==================================================================== */
  /* Fetching the Sheet
  ======================================================================= */
  fetch(`https://docs.google.com/spreadsheets/d/${charadexInfo.sheetID}/gviz/tq?tqx=out:json&headers=1&sheet=${charadexInfo.sheetPage}`)
    .then(i => i.text())
    .then(JSON => {

      $('#loading').hide();
      $('.masterlist-container').addClass('softload');

      /* ================================================================ */
      /* And so it begins
      /* ================================================================ */
      let sheetArray = scrubData(JSON); // Clean up sheet data so we can use it
      let preParam = '&id='; // Determines which is used in a link
        

      /* ================================================================ */
      /* Modifying Array
      /* ================================================================ */
      (() => {

        let filteredArray = [];

        for (let i = 0; i < sheetArray.length; i++) {
          const removed = ['id', 'image','link',''];
          const filtered = Object.fromEntries(
            Object.entries(sheetArray[i]).filter(
              ([key, val])=>!removed.includes(key)
            )
          );
          filteredArray.push(filtered);
        }

        for (let i = 0; i < filteredArray.length; i++) {
          let bigArrayKeys = Object.keys(filteredArray[i]);
          let bigArrayValues = Object.values(filteredArray[i]);
          let joinedInfo = [];
          for (let i = 0; i < bigArrayKeys.length; i++) {
            joinedInfo.push(`
            <div class='p-1 px-3 d-flex justify-content-between text-capitalize'>
              <b>${bigArrayKeys[i].replaceAll('-', ' ')}</b>
              <span>${bigArrayValues[i]}</span>
            </div>`);
          }
          sheetArray[i].HTML = joinedInfo.join("");
        }

        for (let i = 0; i < sheetArray.length; i++) {
          sheetArray[i].link = url.href + preParam + sheetArray[i].id;
          sheetArray[i].orderID = sheetArray[i].id.replace(/\D+/gm,"");
          sheetArray.sort((a, b) => {return a.orderID - b.orderID})
        }

      })();


      /* ================================================================ */
      /* Keys
      /* (Allows list.js to call info from sheet)
      /* ================================================================ */
      let sheetArrayKeys = () => {

        let itemArray = Object.keys(sheetArray[0]);
        let imageIndex = itemArray.indexOf('image');
        let linkIndex = itemArray.indexOf('link');
        itemArray[imageIndex] = {name: 'image', attr: 'src'};
        itemArray[linkIndex] = {name: 'link', attr: 'href'};

        return itemArray;

      };


      if (urlParams.has('id')) {
        
        /* ================================================================ */
        /* Prev & Next for Single Card
        /* ================================================================ */
        (() => {

          let len = sheetArray.length;
          while (len--) {
            if (sheetArray[len].orderID == urlParams.get('id').replace(/\D+/gm,"")) {
              
              // Prev
              if (sheetArray[len - 1]) {
                $("#entryPrev").attr("href", url.href.split('?id')[0].split('&id')[0] + preParam + sheetArray[len - 1].id);
                $("#entryPrev span").text(sheetArray[len - 1].id);
              } else {
                $("#entryPrev i").remove();
              }

              // Next
              if (sheetArray[len + 1]) {
                $("#entryNext").attr("href", url.href.split('?id')[0].split('&id')[0] + preParam + sheetArray[len + 1].id);
                $("#entryNext span").text(sheetArray[len + 1].id);
              } else {
                $("#entryNext i").remove();
              }

            }
          }

          // Back to masterlist (keeps species parameter)
          $("#masterlistLink").attr("href", url.href.split('&id')[0]);

        })();

        /* ================================================================ */
        /* Charadex Single Card
        /* ================================================================ */
        (() => {

          // List.js options
          let itemOptions = {
            valueNames: sheetArrayKeys(),
            item: 'charadex-card',
          };

          // Filtering out singular card
          let designID = urlParams.get('id');
          sheetArray = sheetArray.filter((i) => i.id.includes(designID))[0];

          // Creates singular item
          let charadexItem = new List("charadex-gallery", itemOptions, sheetArray);

        })();

      } else { 
        
        /* ================================================================ */
        /* Charadex Gallery
        /* ================================================================ */
        $('#charadex-filters').show();

        (() => { 

          let galleryOptions = {
            item: 'charadex-entries',
            valueNames: sheetArrayKeys(),
            searchColumns: charadexInfo.searchParams,
            page: charadexInfo.itemAmount,
            pagination: [{
              innerWindow: 1,
              left: 1,
              right: 1,
              item: `<li class='page-item'><a class='page page-link'></a></li>`,
              paginationClass: 'pagination-top',
            }],
          };

          let charadex = new List('charadex-gallery', galleryOptions, sheetArray);

          // Sort based on ID
          charadex.sort("orderID", {order: charadexInfo.itemOrder,})
          

          /* ================================================================ */
          /* Search Filter
          /* ================================================================ */
          $('#search').on('keyup', () => {
            let searchString = $('#search').val();
            charadex.search(searchString);
          });
          

          /* ================================================================ */
          /* Prev/Next in Pagination
          /* ================================================================ */
          $('.btn-next').on('click', () => {$('.pagination .active').next().children('a')[0].click();})
          $('.btn-prev').on('click', () => {$('.pagination .active').prev().children('a')[0].click();})

        })();
        
      }

    })
};


$(document).ready(function(){

  // Fetching URL Parameters
  const url = window.location.href.split('?')[0].split('&')[0];
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  // Customize Page
  const cssCustomization = (arr) => {

    let cssArray = arr;

    let cssProperties = {
      '--cd-primary-color': `#${cssArray.primary}`,
      '--cd-primary-text-color': `#${cssArray.primaryfont}`,
      '--cd-secondary-color': `#${cssArray.secondary}`,
      '--cd-secondary-text-color': `#${cssArray.secondaryfont}`,
      '--cd-body-background-color': `#${cssArray.bodybg}`,
      '--cd-content-background-color': `#${cssArray.containerbg}`,
      '--cd-faded-background-color': `#${cssArray.fadedbg}`,
      '--cd-body-text-color': `#${cssArray.fontcolor}`,
      '--cd-border-color': `#${cssArray.bordercolor}`,
      '--cd-border-width': `${cssArray.borderwidth}`,
      '--cd-border-style': `${cssArray.borderstyle}`,
      '--cd-border-radius': `${cssArray.borderradius}`
    };

    for (const property in cssProperties) {
      if (!cssProperties[property].includes('undefined')) {
        $("body").css(property, cssProperties[property]);
      }
    }

    console.log(cssArray.owner);
                              
    let speciesTitle = (!cssArray.species.includes('undefined')) ? cssArray.species : "Charadex";
    let speciesOwner = (!cssArray.owner.includes('undefined')) ? "Owned by " + cssArray.owner : (cssArray.species) ? "Owned by a mysterious person..." : "Created by Cheeriko";

    document.title = speciesTitle;
    $("#speciestitle").html(speciesTitle);
    $("#speciestitle").attr("href", window.location.href.split('?id=')[0]);
    $("#speciescreator").html(speciesOwner);

  }

  // Customized Sheet
  if (urlParams.has('custom')) {

    const entries = urlParams.entries();
    const cssArray = new Object;

    for(const [key, value] of entries) {
      if (value && value.toLowerCase() !== "#f2f2f1") {
        cssArray[key] = value.replaceAll("#","");
      }
    }

    cssCustomization(cssArray);

    yourOptions.sheetID = cssArray.sheetid;
    yourOptions.sheetPage = cssArray.masterlist;

    charadex(yourOptions);

  } else {
    
    $('#myform').show();

    // Creates
    $('#getParams').on('click',function(){

      let formArray = $("form").serializeArray();
      let cssArray = new Object;
      let formParams = new Array;

      for (let i = 0; i < formArray.length; i++) {
        if (formArray[i].value && formArray[i].value.toLowerCase() !== "#f2f2f1") {
          cssArray[formArray[i].name] = formArray[i].value.replaceAll("#","");
          formParams.push(`&${formArray[i].name}=${formArray[i].value.replaceAll("#","")}`);
        }
      }

      cssCustomization(cssArray);

      let finalUrl = `?custom=true${formParams.join("")}`;
      $('#plainLink').html(finalUrl);
      $('#hyperLink').attr("href", finalUrl);

    });

    charadex(yourOptions);

  }

});