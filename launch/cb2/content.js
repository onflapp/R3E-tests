function initContent(cb) {
  documentContent.values = {
    redirect:'/content/doc',
    _rt:'resource/redirect',
    doc:{
      _rt:'boards'
    }
  };

  documentContent.values['prompts'] = MY_DEFAULT_PROMPTS['prompts'];
  documentContent.values['style'] = MY_DEFAULT_STYLE['style'];

  //store user templates in the document itself
  //userTemplates.storageResource = new RemoteResource(`/${docid}/`);

  cb();
}

var MY_DEFAULT_STYLE = {
  "style": {
    "body_name": "Arial",
    "h1_name": "Arial",
    "h2_name": "Arial",
    "h3_name": "Arial",
    "body_size": "14",
    "h1_size": "20",
    "h2_size": "18",
    "h3_size": "16",
    "em_bold": "bold",
    "strong_bold": "bold",
    "h1_bold": "bold",
    "h2_bold": "bold",
    "h3_bold": "bold",
    "_rt": "text/style",
    "_md": "1750697717157"
  }
};

var MY_DEFAULT_PROMPTS = {
  "prompts": {
    "_rt": "prompts",
    "_md": "1749840898744",
    "transformations": {
      "_rt": "prompts",
      "_md": "1750926234886",
      "text_prompt_1894": {
        "value": "merge all information contained in [TEXT] with information contained in [DOC1]. Skip any duplication. Highlight any differences.",
        "title": "merge",
        "_rt": "text/prompt",
        "_md": "1751460105251"
      },
      "text_prompt_1926": {
        "value": "compare and extract all differences between [TEXT] and [DOC1]",
        "title": "compare",
        "_rt": "text/prompt",
        "_md": "1751471835069"
      }
    },
    "insights": {
      "_rt": "prompts",
      "_md": "1750926259734",
      "text_prompt_1590": {
        "value": "extract names of people, organizations, cities, countries from from [TEXT]. Group the information into different categories",
        "title": "names",
        "_rt": "text/prompt",
        "_md": "1751471316765"
      },
      "text_prompt_1591": {
        "value": "extract summary from the [TEXT]",
        "title": "summary",
        "_rt": "text/prompt",
        "_md": "1751459064174"
      },
      "text_prompt_1866": {
        "value": "create outline from [TEXT]",
        "title": "outline",
        "_rt": "text/prompt",
        "_md": "1751459546712"
      },
      "text_prompt_1892": {
        "value": "use [TEXT1] as reference and verify the information in [TEXT]  is factually correct. Give me only the differences you find.",
        "title": "verify",
        "_rt": "text/prompt",
        "_md": "1752680322818"
      },
      "text_prompt_1895": {
        "value": "extract dates as time line from the [TEXT]",
        "title": "timeline",
        "_rt": "text/prompt",
        "_md": "1751460192708"
      },
      "text_prompt_1950": {
        "value": "give me the most important keywords from [TEXT] . The keywords should be useful for searching",
        "title": "search",
        "transform": "external_search",
        "_rt": "text/prompt",
        "_md": "1751471341893"
      }
    },
    "variations": {
      "_rt": "prompts",
      "_md": "1750926273692",
      "text_prompt_1893": {
        "value": "add appropriate headings for text in [TEXT]",
        "title": "headings",
        "_rt": "text/prompt",
        "_md": "1751460413809"
      },
      "text_prompt_1919": {
        "value": "Simplify the content in [TEXT]. Preserve any important facts.",
        "title": "simplify",
        "_rt": "text/prompt",
        "_md": "1751460509139"
      }
    },
    "saved": {
      "_rt": "prompts",
      "_md": "1751054672226",
      "text_prompt_1586": {
        "value": "extract all names the following text",
        "_rt": "text/prompt",
        "_md": "1751143666219"
      },
      "text_prompt_1654": {
        "value": "compare [TEXT] with [DOC1]",
        "_rt": "text/prompt",
        "_md": "1751267349956"
      },
      "text_prompt_1737": {
        "value": "summarize",
        "_rt": "text/prompt",
        "_md": "1751387465608"
      },
      "text_prompt_1741": {
        "value": "give me all countries affected",
        "_rt": "text/prompt",
        "_md": "1751387500897"
      },
      "text_prompt_1747": {
        "value": "for each contry in list [TEXT] provide details from text fragment [DOC1]",
        "_rt": "text/prompt",
        "_md": "1751389720658"
      },
      "text_prompt_1755": {
        "value": "verify all information in [TEXT] is mentined in [DOC1]",
        "_rt": "text/prompt",
        "_md": "1751389848451"
      },
      "text_prompt_1761": {
        "value": "give me all countries affected",
        "_rt": "text/prompt",
        "_md": "1751391717785"
      },
      "text_prompt_1771": {
        "value": "extract all names the text fragment [TEXT]",
        "_rt": "text/prompt",
        "_md": "1751392032842"
      },
      "text_prompt_1779": {
        "value": "give me a summary",
        "_rt": "text/prompt",
        "_md": "1751392136764"
      },
      "text_prompt_1784": {
        "value": "how is [DOC1] related to [DOC2]",
        "_rt": "text/prompt",
        "_md": "1751392181936"
      },
      "text_prompt_1796": {
        "value": "combine [TEXT] with [DOC1]",
        "_rt": "text/prompt",
        "_md": "1751392752755"
      },
      "text_prompt_1801": {
        "value": "write article which highlight the role of global warming",
        "_rt": "text/prompt",
        "_md": "1751392802452"
      },
      "text_prompt_1806": {
        "value": "write article which highlight the role of global warming and blame everything on the rich",
        "_rt": "text/prompt",
        "_md": "1751392869481"
      },
      "text_prompt_1845": {
        "value": "for each city [TEXT] extract relevant information from [DOC1]",
        "_rt": "text/prompt",
        "_md": "1751459400266"
      },
      "text_prompt_1859": {
        "value": "create outline from [TEXT]",
        "_rt": "text/prompt",
        "_md": "1751459493568"
      },
      "text_prompt_1874": {
        "value": "use [DOC1] as reference and verify the information in [TEXT]  is correct",
        "_rt": "text/prompt",
        "_md": "1751459690570"
      },
      "text_prompt_1879": {
        "value": "use [DOC1] as reference and verify the information in [TEXT]  is correct",
        "_rt": "text/prompt",
        "_md": "1751459735314"
      },
      "text_prompt_1921": {
        "value": "give me the most important keywords from [TEXT] . The keywords should be useful for searching",
        "_rt": "text/prompt",
        "_md": "1751460692139"
      },
      "text_prompt_2024": {
        "value": "for each contry in list [TEXT] provide details from text fragment [DOC1]",
        "_rt": "text/prompt",
        "_md": "1751473270621"
      },
      "text_prompt_2073": {
        "value": "extract keywords userful for searching",
        "_rt": "text/prompt",
        "_md": "1752653507595"
      },
      "text_prompt_2124": {
        "_rt": "text/prompt",
        "_md": "1752659185773"
      },
      "text_prompt_2128": {
        "_rt": "text/prompt",
        "_md": "1752659557941"
      },
      "text_prompt_2138": {
        "_rt": "text/prompt",
        "_md": "1752659670933"
      },
      "text_prompt_2150": {
        "value": "give me tips what I can do in Basel",
        "_rt": "text/prompt",
        "_md": "1752659770070"
      },
      "text_prompt_2153": {
        "value": "give me tips on what I can do in Basel",
        "_rt": "text/prompt",
        "_md": "1752659809629"
      },
      "text_prompt_2157": {
        "value": "using information from [DOC1], create nice welcome email",
        "_rt": "text/prompt",
        "_md": "1752659993405"
      },
      "text_prompt_2171": {
        "value": "based on information from [TEXT1] create welcome email and propose what what do over the weekend",
        "_rt": "text/prompt",
        "_md": "1752662151619"
      },
      "text_prompt_2182": {
        "_rt": "text/prompt",
        "_md": "1752662657690"
      },
      "text_prompt_2220": {
        "_rt": "text/prompt",
        "_md": "1752678666886"
      },
      "text_prompt_2228": {
        "_rt": "text/prompt",
        "_md": "1752678756690"
      },
      "text_prompt_2231": {
        "_rt": "text/prompt",
        "_md": "1752678807168"
      },
      "text_prompt_2234": {
        "value": "use this persona and summarize it",
        "_rt": "text/prompt",
        "_md": "1752678868411"
      },
      "text_prompt_2240": {
        "value": "Emma comes to vision for a week, suggest activities for her",
        "_rt": "text/prompt",
        "_md": "1752678970295"
      },
      "text_prompt_2248": {
        "value": "create welcome email for [TEXT1] and suggest some activities for the weeked around basel",
        "_rt": "text/prompt",
        "_md": "1752679195984"
      },
      "text_prompt_2252": {
        "value": "give me open times for Zoo Basel",
        "_rt": "text/prompt",
        "_md": "1752679288043"
      },
      "text_prompt_2258": {
        "value": "open times",
        "_rt": "text/prompt",
        "_md": "1752679725390"
      },
      "text_prompt_2273": {
        "value": "add open times for Zoo Basel from [TEXT1]",
        "_rt": "text/prompt",
        "_md": "1752679923080"
      },
      "text_prompt_2290": {
        "value": "indentity all common facts from [TEXT1]",
        "_rt": "text/prompt",
        "_md": "1752680118486"
      },
      "text_prompt_2303": {
        "_rt": "text/prompt",
        "_md": "1752681023149"
      },
      "text_prompt_2311": {
        "_rt": "text/prompt",
        "_md": "1752681623102"
      },
      "text_prompt_2317": {
        "_rt": "text/prompt",
        "_md": "1752681688309"
      },
      "text_prompt_2323": {
        "value": "suggest an activities for this persona around basel",
        "_rt": "text/prompt",
        "_md": "1752681876758"
      },
      "text_prompt_2327": {
        "value": "create a welcome email for [TEXT1] including information from [TEXT2]",
        "_rt": "text/prompt",
        "_md": "1752681989401"
      },
      "text_prompt_2331": {
        "value": "add activities based on persona described in [TEXT1]",
        "_rt": "text/prompt",
        "_md": "1752682039330"
      },
      "text_prompt_2341": {
        "value": "suggest activities around basel and include activities from [TEXT1]",
        "_rt": "text/prompt",
        "_md": "1752682646627"
      },
      "text_prompt_2345": {
        "value": "extract activities as a list",
        "_rt": "text/prompt",
        "_md": "1752682738486"
      },
      "text_prompt_2357": {
        "value": "suggest activities",
        "_rt": "text/prompt",
        "_md": "1752683410212"
      },
      "text_prompt_2362": {
        "_rt": "text/prompt",
        "_md": "1752683600532"
      },
      "text_prompt_2366": {
        "value": "include the open times from [TEXT1]",
        "_rt": "text/prompt",
        "_md": "1752683682430"
      },
      "text_prompt_2379": {
        "_rt": "text/prompt",
        "_md": "1752686396472"
      },
      "text_prompt_2423": {
        "value": "give me a profile of a person who works for this organization",
        "_rt": "text/prompt",
        "_md": "1752758785383"
      },
      "text_prompt_2463": {
        "_rt": "text/prompt",
        "_md": "1753388585729"
      },
      "text_prompt_2467": {
        "_rt": "text/prompt",
        "_md": "1753388875336"
      }
    }
  }
};
