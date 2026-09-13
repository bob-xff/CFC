#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""向 build/name_dict.json 合并一批人工校订的人名/姓氏译名。

只做增量合并（setdefault 语义的可覆盖白名单），不删除任何既有条目。
键统一小写 + 变音折叠，与 translit.py 的 fold() 保持一致。
"""
import io
import json
import os
import re

BUILD = os.path.dirname(os.path.abspath(__file__))
DICT = os.path.join(BUILD, 'name_dict.json')

# ---------------- 姓氏（词元级） ----------------
SUR = {
    # 荷兰语（-g -> 赫 / -ij -> 伊 / oe -> 乌）
    'ligt': '利赫特', 'jong': '容', 'vrij': '弗赖', 'roon': '罗恩',
    'ketelaere': '德凯特拉雷', 'gea': '赫亚', 'winter': '温特',
    'normand': '诺尔曼', 'dijk': '迪克', 'ven': '文', 'hecke': '赫克',
    'bruyne': '德布劳内', 'depay': '德佩', 'dumfries': '邓弗里斯',
    'gravenberch': '赫拉芬贝赫', 'gakpo': '加克波', 'simons': '西蒙斯',
    'frimpong': '弗林蓬', 'schouten': '斯豪滕', 'veerman': '维尔曼',
    'bergwijn': '贝尔温', 'wijnaldum': '维纳尔杜姆', 'koopmeiners': '科普迈纳斯',
    'dumfries': '邓弗里斯', 'malen': '马伦', 'lang': '朗',
    # 意大利语（-o/-i 尾常脱落，gn -> 尼）
    'gregorio': '格雷戈里奥', 'lorenzo': '洛伦佐', 'bastoni': '巴斯托尼',
    'barella': '巴雷拉', 'calafiori': '卡拉菲奥里', 'tonali': '托纳利',
    'scamacca': '斯卡马卡', 'chiesa': '基耶萨', 'locatelli': '洛卡特利',
    'retegui': '雷特吉', 'oristano': '奥里斯塔尼奥', 'frattesi': '弗拉泰西',
    # 英语 / 苏格兰
    'allister': '阿利斯特', 'mcallister': '麦卡利斯特', 'mctominay': '麦克托米奈',
    'mcginn': '麦金', 'robertson': '罗伯逊', 'grealish': '格拉利什',
    'rashford': '拉什福德', 'trippier': '特里皮尔', 'bhoy': '博伊',
    'barry': '巴里', 'wharton': '沃顿', 'gordon': '戈登', 'bowen': '鲍恩',
    'palmer': '帕尔默', 'watkins': '沃特金斯', 'stones': '斯通斯',
    # 法语（-e 尾脱落 / 鼻化）
    'normand': '诺尔曼', 'camavinga': '卡马文加', 'tchouameni': '琼阿梅尼',
    'saliba': '萨利巴', 'konate': '科纳特', 'upamecano': '乌帕梅卡诺',
    'maignan': '迈尼昂', 'brunot': '布吕诺', 'mendes': '门德斯',
    'thorn': '索恩', 'lacroix': '拉克鲁瓦',
    # 德语（-er -> 尔 / ei -> 艾 / eu -> 奥伊）
    'wirtz': '维尔茨', 'musiala': '穆西亚拉', 'kimmich': '基米希',
    'neuer': '诺伊尔', 'gundogan': '京多安', 'schlotterbeck': '施洛特贝克',
    'raum': '劳姆', 'havertz': '哈弗茨', 'sané': '萨内', 'sane': '萨内',
    'gross': '格罗斯', 'andrich': '安德里希', 'fuehrich': '菲里希',
    # 西班牙 / 葡萄牙
    'yamal': '亚马尔', 'pedri': '佩德里', 'gavi': '加维', 'nico': '尼科',
    'ferran': '费兰', 'olmo': '奥尔莫', 'cubarsi': '库巴西',
    'carvajal': '卡瓦哈尔', 'rodri': '罗德里', 'morata': '莫拉塔',
    'oyarzabal': '奥亚萨瓦尔', 'zubimendi': '苏维门迪', 'merino': '梅里诺',
    'vinicius': '维尼修斯', 'rodrygo': '罗德里戈', 'raphinha': '拉菲尼亚',
    'araujo': '阿劳霍', 'cancelo': '坎塞洛', 'felix': '菲利克斯',
    'bernardo': '贝尔纳多', 'vitic': '维蒂', 'neto': '内图',
    # 北欧 / 东欧
    'gyokeres': '约克雷斯', 'isak': '伊萨克', 'haaland': '哈兰德',
    'odegaard': '厄德高', 'sorloth': '瑟尔洛特', 'bergvall': '贝里瓦尔',
    'kulushevski': '库卢塞夫斯基', 'szoboszlai': '索博斯洛伊',
    'modric': '莫德里奇', 'kovacic': '科瓦契奇', 'gvardiol': '格瓦迪奥尔',
    'sucic': '苏契奇', 'doku': '多库', 'trossard': '特罗萨德',
    # 非洲 / 阿拉伯
    'salah': '萨拉赫', 'mane': '马内', 'kante': '坎特', 'dembele': '登贝莱',
    'osimhen': '奥斯梅恩', 'kvaratskhelia': '克瓦拉茨赫利亚',
    'hakimi': '哈基米', 'ziyech': '齐耶赫', 'ounahi': '乌纳希',
    'ennesyri': '恩内斯里', 'bounou': '布努', 'amrabat': '阿姆拉巴特',
    'el khannouss': '埃尔哈努斯', 'aynaoui': '阿纳维',
    # 南美
    'messi': '梅西', 'alvarez': '阿尔瓦雷斯', 'martinez': '马丁内斯',
    'enrique': '恩里克', 'mac allister': '麦卡利斯特', 'dimaria': '迪马利亚',
    'garnacho': '加纳乔', 'buonanotte': '博纳诺特', 'colwill': '科尔威尔',
}

# ---------------- 教名（词元级） ----------------
GIVEN = {
    'frenkie': '弗伦基', 'charles': '沙尔', 'thierno': '蒂埃诺', 'koni': '科尼',
    'marten': '马滕', 'micky': '米基', 'matthijs': '马泰斯', 'virgil': '维吉尔',
    'cody': '科迪', 'xavi': '哈维', 'declan': '德克兰', 'bukayo': '布卡约',
    'marc': '马克', 'marc-andre': '马克-安德烈', 'jan': '扬', 'paul': '保罗',
    'alexis': '亚历克西斯', 'neil': '内尔', 'giovanni': '乔瓦尼',
    'michele': '米凯莱', 'stefan': '斯特凡', 'robin': '罗宾', 'david': '大卫',
    'kylian': '基利安', 'vinicius': '维尼修斯', 'rodrygo': '罗德里戈',
    'erling': '埃尔林', 'martin': '马丁', 'lautaro': '劳塔罗', 'julian': '胡利安',
    'florian': '弗洛里安', 'jamal': '贾马尔', 'alejandro': '亚历杭德罗',
    'pedri': '佩德里', 'lamine': '拉明', 'omar': '奥马尔', 'mohamed': '穆罕默德',
    'achraf': '阿什拉夫', 'brahim': '卜拉欣', 'antoine': '安托万',
    'ousmane': '乌斯曼', 'ibrahima': '易卜拉希马', 'kalidou': '卡利杜',
    'sadio': '萨迪奥', 'edouard': '爱德华', 'raphael': '拉斐尔',
    'gabriel': '加布里埃尔', 'william': '威廉', 'alexander': '亚历山大',
    'joshua': '约书亚', 'leon': '莱昂', 'jonathan': '乔纳森', 'denzel': '登泽尔',
    'jurrien': '尤里恩', 'nathan': '内森', 'tijjani': '蒂贾尼', 'joey': '乔伊',
    'ryan': '瑞安', 'morgan': '摩根', 'anthony': '安东尼', 'marcus': '马库斯',
    'lucas': '卢卡斯', 'theo': '特奥', 'rafael': '拉斐尔', 'saul': '萨乌尔',
}

# ---------------- 全名（多词整体覆盖，优先级最高） ----------------
FULL = {    'alexis mac allister': '亚历克西斯·麦卡利斯特',
    'virgil van dijk': '维吉尔·范迪克',
    'frenkie de jong': '弗伦基·德容',
    'matthijs de ligt': '马泰斯·德利赫特',
    'micky van de ven': '米基·范德文',
    'jan paul van hecke': '扬·保罗·范赫克',
    'marc-andre ter stegen': '马克-安德烈·特尔施特根',
    'giovanni di lorenzo': '乔瓦尼·迪洛伦佐',
    'michele di gregorio': '米凯莱·迪格雷戈里奥',
    'charles de ketelaere': '沙尔·德凯特拉雷',
    'stefan de vrij': '斯特凡·德弗赖',
    'marten de roon': '马滕·德罗恩',
    'robin le normand': '罗宾·勒诺尔曼',
    'koni de winter': '科尼·德温特',
    'david de gea': '大卫·德赫亚',
    'neil el aynaoui': '内尔·埃尔阿纳维',
    'kevin de bruyne': '凯文·德布劳内',
    'thierno barry': '蒂埃诺·巴里',
    # ---- V2.6.1 三路审计 Top30 校订 ----
    'cole palmer': '科尔·帕尔默',
    'xabi alonso': '哈维·阿隆索',
    'diego simeone': '迭戈·西蒙尼',
    'luciano spalletti': '卢西亚诺·斯帕莱蒂',
    'joao moutinho': '若昂·穆蒂尼奥',
    'trent alexander-arnold': '特伦特·亚历山大-阿诺德',
    'myles lewis-skelly': '迈尔斯·刘易斯-斯凯利',
    'james ward-prowse': '詹姆斯·沃德-普劳斯',
    'kiernan dewsbury-hall': '基尔南·迪尤斯伯里-霍尔',
    'josko gvardiol': '约什科·格瓦迪奥尔',
    'rayan ait-nouri': '拉扬·艾特-努里',
    "nico o'reilly": '尼科·奥莱利',
    'roberto de zerbi': '罗伯托·德泽尔比',
    'jordan pickford': '乔丹·皮克福德',
    'jarrad branthwaite': '贾拉德·布兰斯韦特',
    'bruno guimaraes': '布鲁诺·吉马良斯',
    'kobbie mainoo': '科比·梅努',
    'aaron ramsdale': '亚伦·拉姆斯代尔',
    'mason greenwood': '梅森·格林伍德',
    'calvin bassey': '卡尔文·巴锡',
    'mile svilar': '米莱·斯维拉尔',
    'giorgio scalvini': '乔治·斯卡尔维尼',
    'luka vuskovic': '卢卡·武什科维奇',
    'christos mandas': '克里斯托斯·曼达斯',
    'jeremy doku': '杰雷米·多库',
    'jeremie frimpong': '杰里米·弗林蓬',
    'sverre nypan': '斯韦雷·尼潘',
    'kaishu sano': '佐野海舟',
    'yuito suzuki': '铃木悠人',
    'shigetoshi hasebe': '长谷部茂利',
}

# 韩日全名（罗马字整体覆写；键会被 fold 折叠，连字符统一成空格）
KO_FULL_X = {
    'yoon bit garam': '尹比加兰',
    'heo yool': '许律',
    'cho gue sung': '赵圭成',
    'lee kang in': '李刚仁',
    'kim min jae': '金玟哉',
    'son heung min': '孙兴慜',
    'hwang hee chan': '黄喜灿',
    'lee jae sung': '李在城',
    'kim seung gyu': '金承奎',
    'jo hyeon woo': '赵贤祐',
    'hong hyun seok': '洪贤锡',
    'oh hyeon gyu': '吴贤揆',
    'bae jun ho': '裴峻浩',
    'yang hyun jun': '梁泫准',
    'seol young woo': '薛英佑',
    'jeong woo yeong': '郑又荣',
    'park yong woo': '朴镕宇',
    'kim jin su': '金珍洙',
    'lee ki je': '李基济',
    'won du jae': '元斗才',
}

JP_FULL_X = {
    'takefusa kubo': '久保建英',
    'kaoru mitoma': '三笘薰',
    'daichi kamada': '镰田大地',
    'wataru endo': '远藤航',
    'ko itakura': '板仓滉',
    'shogo taniguchi': '谷口彰悟',
    'ryo hiroki ito': '伊藤洋辉',
    'hiroki ito': '伊藤洋辉',
    'junya ito': '伊藤纯也',
    'yuto nagatomo': '长友佑都',
    'shuichi gonda': '权田修一',
    'daniel schmidt': '丹尼尔·施密特',
    'zion suzuki': '铃木彩艳',
    'ao tanaka': '田中碧',
    'hidemasa morita': '守田英正',
    'takumi minamino': '南野拓实',
    'ayase ueda': '上田绮世',
    'kyogo furuhashi': '古桥亨梧',
    'sho sasaki': '佐佐木翔',
}

FOLD = str.maketrans({'á': 'a', 'à': 'a', 'â': 'a', 'ä': 'a', 'ã': 'a', 'å': 'a',
                      'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
                      'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
                      'ó': 'o', 'ò': 'o', 'ô': 'o', 'ö': 'o', 'õ': 'o', 'ø': 'o',
                      'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
                      'ç': 'c', 'ñ': 'n', 'ý': 'y', 'š': 's', 'ž': 'z',
                      'ć': 'c', 'č': 'c', 'đ': 'd', 'ł': 'l', 'ğ': 'g',
                      'ş': 's', 'ı': 'i', 'ę': 'e', 'ą': 'a', 'ź': 'z', 'ż': 'z',
                      'ń': 'n', 'ś': 's', 'ř': 'r', 'ě': 'e', 'ů': 'u'})


def norm(k):
    return re.sub(r'\s+', ' ', k.translate(FOLD)).strip().lower()


def main():
    with io.open(DICT, encoding='utf-8') as f:
        d = json.load(f)
    added = {}
    pairs = (('surnames', SUR), ('given', GIVEN), ('full', FULL),
             ('ko_full', KO_FULL_X), ('jp_full', JP_FULL_X))
    for key, src in pairs:
        cur = d.setdefault(key, {})
        n = 0
        for k, v in src.items():
            kk = norm(k)
            if cur.get(kk) != v:
                cur[kk] = v
                n += 1
        added[key] = n
    with io.open(DICT, 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, indent=0, sort_keys=True)
    print('合并完成：', added)
    print('词表规模：surnames=%d given=%d full=%d jp_surnames=%d ko_full=%d jp_full=%d'
          % (len(d.get('surnames', {})), len(d.get('given', {})), len(d.get('full', {})),
             len(d.get('jp_surnames', {})), len(d.get('ko_full', {})), len(d.get('jp_full', {}))))


if __name__ == '__main__':
    main()
