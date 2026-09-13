# -*- coding: utf-8 -*-
"""拉丁姓名 -> 中文音译引擎（按中文足球媒体的国际惯例）

架构（音节驱动，而非逐字符）：
  1. fold        变音折叠（ø→o, ß→ss, ñ→n, ć→ch, š→sh ...）
  2. lang_hint   按国籍套用语言专属拼读规则（西/葡/意/德/法/荷/北欧/土/斯夫）
  3. dedup       合并无意义重辅音（bb→b, tt→t；西/葡/意的 ll/rr/ss/zz 保留）
  4. syllabify   切音节 (onset, vowel, coda)，音节间 coda 至多 1 个辅音
  5. render      每音节 = onset+vowel 查表；词尾 coda 查簇表
  6. override    权威译名表 / 固定人名表 / 前缀词表

用法：
    from translit import to_zh
    to_zh('Erling Haaland', 'Norway')   -> '埃尔林·哈兰德'
"""
import re
import io
import json
import os

# ================================================================ 1. 变音折叠
FOLD = {
    'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'ā': 'a', 'ă': 'a', 'ą': 'a',
    'ç': 'c', 'ć': 'c', 'č': 'c', 'ĉ': 'c', 'ċ': 'c', 'ď': 'd', 'đ': 'd', 'ð': 'd',
    'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e', 'ē': 'e', 'ĕ': 'e', 'ė': 'e', 'ę': 'e', 'ě': 'e',
    'ĝ': 'g', 'ğ': 'g', 'ġ': 'g', 'ģ': 'g', 'ĥ': 'h', 'ħ': 'h',
    'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i', 'ī': 'i', 'ĭ': 'i', 'į': 'i', 'ı': 'i',
    'ĵ': 'j', 'ķ': 'k', 'ĺ': 'l', 'ļ': 'l', 'ľ': 'l', 'ł': 'l',
    'ñ': 'n', 'ń': 'n', 'ņ': 'n', 'ň': 'n',
    'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o', 'ō': 'o', 'ŏ': 'o', 'ő': 'o',
    'ŕ': 'r', 'ř': 'r', 'ś': 's', 'ŝ': 's', 'ş': 's', 'š': 's', 'ș': 's',
    'ţ': 't', 'ť': 't', 'ț': 't',
    'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u', 'ū': 'u', 'ŭ': 'u', 'ů': 'u', 'ű': 'u', 'ų': 'u',
    'ẃ': 'w', 'ŵ': 'w', 'ý': 'y', 'ÿ': 'y', 'ŷ': 'y', 'ź': 'z', 'ż': 'z', 'ž': 'z',
    'ß': 'ss', 'æ': 'ae', 'œ': 'oe', 'þ': 'th', 'ĳ': 'ij', 'ĸ': 'k',
}
# 斯拉夫软音（在 fold 之后按语言再改写，这里给出基础映射）
SLV = {'ć': 'ch', 'č': 'ch', 'š': 'sh', 'ž': 'zh', 'đ': 'd', 'đ': 'd', 'ł': 'w'}


def fold(s, slavic=False):
    s = (s or '').lower()
    if slavic:
        for a, b in SLV.items():
            s = s.replace(a, b)
    s = ''.join(FOLD.get(ch, ch) for ch in s)
    s = re.sub(r"['’`.\-]", ' ', s)
    s = re.sub(r'[^a-z ]', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


# ================================================================ 2. 语言分组
LANG_SETS = {
    'es': {'Spain', 'Mexico', 'Colombia', 'Argentina', 'Chile', 'Peru', 'Ecuador',
           'Uruguay', 'Paraguay', 'Venezuela', 'Bolivia', 'Costa Rica', 'Honduras',
           'Panama', 'Guatemala', 'Dominican Republic', 'Cuba', 'Puerto Rico'},
    'pt': {'Portugal', 'Brazil', 'Angola', 'Mozambique', 'Cape Verde', 'Guinea-Bissau',
           'Sao Tome and Principe', 'East Timor'},
    'it': {'Italy', 'San Marino'},
    'de': {'Germany', 'Austria', 'Switzerland', 'Liechtenstein', 'Luxembourg'},
    'fr': {'France', 'Belgium', 'Senegal', "Cote d'Ivoire", 'Ivory Coast', 'Mali',
           'Cameroon', 'Burkina Faso', 'Guinea', 'Togo', 'Benin', 'Niger', 'Chad',
           'Congo', 'DR Congo', 'Gabon', 'Madagascar', 'Morocco', 'Algeria', 'Tunisia',
           'Mauritania', 'Central African Republic', 'Burundi', 'Rwanda', 'Djibouti',
           'Comoros', 'Haiti', 'Monaco'},
    'sl': {'Croatia', 'Serbia', 'Bosnia and Herzegovina', 'Montenegro', 'Slovenia',
           'North Macedonia', 'Bulgaria', 'Poland', 'Czech Republic', 'Slovakia',
           'Lithuania', 'Latvia'},
    'east': {'Russia', 'Ukraine', 'Belarus', 'Georgia', 'Armenia', 'Moldova', 'Kazakhstan',
             'Uzbekistan', 'Azerbaijan', 'Kyrgyzstan', 'Tajikistan', 'Turkmenistan'},
    'nl': {'Netherlands', 'Suriname', 'Indonesia'},
    'tr': {'Turkey'},
    'nord': {'Denmark', 'Norway', 'Sweden', 'Iceland', 'Finland', 'Faroe Islands'},
    'gr': {'Greece', 'Cyprus'},
    'ar': {'Saudi Arabia', 'Qatar', 'United Arab Emirates', 'Egypt', 'Iraq', 'Jordan',
           'Kuwait', 'Bahrain', 'Oman', 'Yemen', 'Syria', 'Lebanon', 'Libya', 'Sudan',
           'Palestine', 'Israel'},
    'jp': {'Japan'},
    'kr': {'Korea, South', 'South Korea', 'Korea, North'},
}
_CIT2LANG = {c: k for k, v in LANG_SETS.items() for c in v}


def lang_of(cit):
    return _CIT2LANG.get((cit or '').strip(), 'en')


# ================================================================ 3. 音节表
def _mk(rows):
    d = {}
    for on, tup in rows.items():
        for v, zh in zip('aeiou', tup):
            if zh:
                d[on + v] = zh
    return d


ONSET = _mk({
    'b': ('巴', '贝', '比', '博', '布'),
    'c': ('卡', '塞', '西', '科', '库'),
    'd': ('达', '德', '迪', '多', '杜'),
    'f': ('法', '费', '菲', '福', '富'),
    'g': ('加', '格', '吉', '戈', '古'),
    'h': ('哈', '赫', '希', '霍', '胡'),
    'k': ('卡', '凯', '基', '科', '库'),
    'l': ('拉', '莱', '利', '洛', '卢'),
    'm': ('马', '梅', '米', '莫', '穆'),
    'n': ('纳', '内', '尼', '诺', '努'),
    'p': ('帕', '佩', '皮', '波', '普'),
    'r': ('拉', '雷', '里', '罗', '鲁'),
    's': ('萨', '塞', '西', '索', '苏'),
    't': ('塔', '特', '蒂', '托', '图'),
    'v': ('瓦', '维', '维', '沃', '武'),
    'w': ('瓦', '韦', '威', '沃', '伍'),
    'y': ('亚', '耶', '伊', '约', '尤'),
    'z': ('扎', '泽', '齐', '佐', '祖'),
    'x': ('克萨', '克塞', '克西', '克索', '克苏'),
    'q': ('卡', '克', '基', '科', '库'),
    'j': ('贾', '杰', '吉', '乔', '久'),
})
ONSET.update(_mk({
    'sch': ('沙', '舍', '希', '绍', '舒'),
    'tsch': ('恰', '切', '奇', '乔', '楚'),
    'tch': ('恰', '切', '奇', '乔', '楚'),
    'sh': ('沙', '谢', '希', '肖', '舒'),
    'ch': ('查', '切', '奇', '乔', '楚'),
    'th': ('塔', '特', '蒂', '托', '图'),
    'ph': ('法', '费', '菲', '福', '富'),
    'gh': ('加', '格', '吉', '戈', '古'),
    'wh': ('瓦', '韦', '威', '沃', '伍'),
    'kh': ('哈', '赫', '希', '霍', '胡'),
    'zh': ('扎', '热', '日', '若', '茹'),
    'ts': ('察', '采', '齐', '措', '楚'),
    'dz': ('扎', '泽', '齐', '佐', '祖'),
    'gn': ('尼亚', '涅', '尼', '尼奥', '纽'),
    'ny': ('尼亚', '涅', '尼', '尼奥', '纽'),
    'nj': ('尼亚', '涅', '尼', '尼奥', '纽'),
    'll': ('利亚', '列', '利', '略', '柳'),
    'lj': ('利亚', '列', '利', '略', '柳'),
    'rr': ('拉', '雷', '里', '罗', '鲁'),
    'ss': ('萨', '塞', '西', '索', '苏'),
    'qu': ('夸', '克', '基', '科', '库'),
    'gu': ('瓜', '格', '吉', '戈', '古'),
    'sc': ('斯卡', '谢', '希', '斯科', '斯库'),
    'sj': ('沙', '谢', '希', '肖', '舒'),
    'kj': ('恰', '切', '奇', '乔', '楚'),
    'gj': ('贾', '杰', '吉', '乔', '久'),
    'hj': ('亚', '耶', '伊', '约', '尤'),
    'ck': ('卡', '克', '基', '科', '库'),
    'br': ('布拉', '布雷', '布里', '布罗', '布鲁'),
    'cr': ('克拉', '克雷', '克里', '克罗', '克鲁'),
    'dr': ('德拉', '德雷', '德里', '德罗', '德鲁'),
    'fr': ('弗拉', '弗雷', '弗里', '弗罗', '弗鲁'),
    'gr': ('格拉', '格雷', '格里', '格罗', '格鲁'),
    'pr': ('普拉', '普雷', '普里', '普罗', '普鲁'),
    'tr': ('特拉', '特雷', '特里', '特罗', '特鲁'),
    'vr': ('弗拉', '弗雷', '弗里', '弗罗', '弗鲁'),
    'bl': ('布拉', '布莱', '布里', '布洛', '布鲁'),
    'cl': ('克拉', '克莱', '克利', '克洛', '克鲁'),
    'fl': ('弗拉', '弗莱', '弗利', '弗洛', '弗鲁'),
    'gl': ('格拉', '格莱', '格利', '格洛', '格鲁'),
    'pl': ('普拉', '普莱', '普利', '普洛', '普鲁'),
    'sl': ('斯拉', '斯莱', '斯利', '斯洛', '斯鲁'),
}))


# ---------------------------------------------------------------- 鼻音尾音节表
# 中文音译惯例里，「元音 + n/ng」是**一个汉字**（An=安, Kon=孔, stan=斯坦），
# 绝不可拆成「阿 + 恩」。此表把 onset+vowel+nasal 三合一。
# 每个 onset 给 15 个槽位：a,e,i,o,u 各 × (无尾, n, ng)
def _mk3(rows):
    d = {}
    for on, tup in rows.items():
        i = 0
        for v in 'aeiou':
            for suf in ('', 'n', 'ng'):
                zh = tup[i]; i += 1
                if zh:
                    d[on + v + suf] = zh
    return d


ONSET_NAS = _mk3({
    '':  ('阿', '安', '昂', '埃', '恩', '恩', '伊', '因', '英', '奥', '翁', '翁', '乌', '温', '翁'),
    'b': ('巴', '班', '邦', '贝', '本', '崩', '比', '宾', '宾', '博', '邦', '邦', '布', '本', '崩'),
    'c': ('卡', '坎', '康', '塞', '森', '森', '西', '辛', '辛', '科', '孔', '孔', '库', '昆', '孔'),
    'd': ('达', '丹', '当', '德', '登', '登', '迪', '丁', '丁', '多', '登', '东', '杜', '敦', '东'),
    'f': ('法', '凡', '方', '费', '芬', '丰', '菲', '芬', '芬', '福', '丰', '丰', '富', '丰', '丰'),
    'g': ('加', '甘', '冈', '格', '根', '根', '吉', '金', '京', '戈', '贡', '贡', '古', '贡', '贡'),
    'h': ('哈', '汉', '杭', '赫', '亨', '亨', '希', '欣', '兴', '霍', '洪', '洪', '胡', '洪', '洪'),
    'j': ('贾', '詹', '詹', '杰', '金', '金', '吉', '金', '京', '乔', '琼', '琼', '久', '俊', '俊'),
    'k': ('卡', '坎', '康', '凯', '肯', '肯', '基', '金', '京', '科', '孔', '孔', '库', '昆', '孔'),
    'l': ('拉', '兰', '朗', '莱', '伦', '伦', '利', '林', '林', '洛', '隆', '隆', '卢', '伦', '伦'),
    'm': ('马', '曼', '芒', '梅', '门', '蒙', '米', '明', '明', '莫', '蒙', '蒙', '穆', '蒙', '蒙'),
    'n': ('纳', '南', '南', '内', '嫩', '能', '尼', '宁', '宁', '诺', '农', '农', '努', '农', '农'),
    'p': ('帕', '潘', '庞', '佩', '彭', '彭', '皮', '平', '平', '波', '蓬', '蓬', '普', '蓬', '蓬'),
    'q': ('卡', '坎', '康', '克', '肯', '肯', '基', '金', '京', '科', '孔', '孔', '库', '昆', '孔'),
    'r': ('拉', '兰', '朗', '雷', '伦', '伦', '里', '林', '林', '罗', '龙', '龙', '鲁', '伦', '伦'),
    's': ('萨', '桑', '桑', '塞', '森', '森', '西', '辛', '辛', '索', '松', '松', '苏', '孙', '松'),
    't': ('塔', '坦', '唐', '特', '滕', '滕', '蒂', '廷', '廷', '托', '顿', '通', '图', '通', '通'),
    'v': ('瓦', '万', '旺', '维', '文', '文', '维', '文', '文', '沃', '冯', '冯', '武', '文', '文'),
    'w': ('瓦', '万', '旺', '韦', '文', '翁', '威', '温', '温', '沃', '翁', '翁', '伍', '温', '翁'),
    'x': ('克萨', '克桑', '克桑', '克塞', '克森', '克森', '克西', '克辛', '克辛',
          '克索', '克松', '克松', '克苏', '克孙', '克松'),
    'y': ('亚', '扬', '扬', '耶', '延', '延', '伊', '因', '英', '约', '永', '永', '尤', '云', '云'),
    'z': ('扎', '赞', '藏', '泽', '曾', '曾', '齐', '津', '京', '佐', '宗', '宗', '祖', '尊', '宗'),
})
ONSET_NAS.update(_mk3({
    'sh':  ('沙', '山', '尚', '谢', '申', '申', '希', '欣', '兴', '肖', '雄', '雄', '舒', '顺', '顺'),
    'ch':  ('查', '钱', '昌', '切', '陈', '陈', '奇', '钦', '庆', '乔', '琼', '琼', '楚', '春', '春'),
    'th':  ('塔', '坦', '唐', '特', '滕', '滕', '蒂', '廷', '廷', '托', '通', '通', '图', '通', '通'),
    'ph':  ('法', '凡', '方', '费', '芬', '丰', '菲', '芬', '芬', '福', '丰', '丰', '富', '丰', '丰'),
    'gh':  ('加', '甘', '冈', '格', '根', '根', '吉', '金', '京', '戈', '贡', '贡', '古', '贡', '贡'),
    'kh':  ('哈', '汉', '杭', '赫', '亨', '亨', '希', '欣', '兴', '霍', '洪', '洪', '胡', '洪', '洪'),
    'zh':  ('扎', '赞', '藏', '热', '仁', '仁', '日', '任', '仁', '若', '荣', '荣', '茹', '润', '润'),
    'ts':  ('察', '灿', '仓', '采', '岑', '岑', '齐', '钦', '青', '措', '聪', '聪', '楚', '春', '春'),
    'dz':  ('扎', '赞', '藏', '泽', '曾', '曾', '齐', '津', '京', '佐', '宗', '宗', '祖', '尊', '宗'),
    'sch': ('沙', '山', '尚', '舍', '申', '申', '希', '欣', '兴', '绍', '雄', '雄', '舒', '顺', '顺'),
    'tch': ('恰', '钱', '昌', '切', '陈', '陈', '奇', '钦', '庆', '乔', '琼', '琼', '楚', '春', '春'),
    'tsch': ('恰', '钱', '昌', '切', '陈', '陈', '奇', '钦', '庆', '乔', '琼', '琼', '楚', '春', '春'),
    'gn':  ('尼亚', '尼安', '尼昂', '涅', '年', '年', '尼', '宁', '宁', '尼奥', '尼翁', '尼翁', '纽', '纽', '纽'),
    'ny':  ('尼亚', '尼安', '尼昂', '涅', '年', '年', '尼', '宁', '宁', '尼奥', '尼翁', '尼翁', '纽', '纽', '纽'),
    'nj':  ('尼亚', '尼安', '尼昂', '涅', '年', '年', '尼', '宁', '宁', '尼奥', '尼翁', '尼翁', '纽', '纽', '纽'),
    'll':  ('利亚', '利安', '利昂', '列', '连', '连', '利', '林', '林', '略', '利翁', '利翁', '柳', '柳', '柳'),
    'lj':  ('利亚', '利安', '利昂', '列', '连', '连', '利', '林', '林', '略', '利翁', '利翁', '柳', '柳', '柳'),
    'rr':  ('拉', '兰', '朗', '雷', '伦', '伦', '里', '林', '林', '罗', '龙', '龙', '鲁', '伦', '伦'),
    'ss':  ('萨', '桑', '桑', '塞', '森', '森', '西', '辛', '辛', '索', '松', '松', '苏', '孙', '松'),
    'qu':  ('夸', '宽', '匡', '克', '肯', '肯', '基', '金', '京', '科', '孔', '孔', '库', '昆', '孔'),
    'gu':  ('瓜', '关', '光', '格', '根', '根', '吉', '金', '京', '戈', '贡', '贡', '古', '贡', '贡'),
    'sc':  ('斯卡', '斯坎', '斯康', '谢', '申', '申', '希', '欣', '兴', '斯科', '斯孔', '斯孔',
            '斯库', '斯昆', '斯孔'),
    'ck':  ('卡', '坎', '康', '克', '肯', '肯', '基', '金', '京', '科', '孔', '孔', '库', '昆', '孔'),
    'sj':  ('沙', '山', '尚', '谢', '申', '申', '希', '欣', '兴', '肖', '雄', '雄', '舒', '顺', '顺'),
    'kj':  ('恰', '钱', '昌', '切', '陈', '陈', '奇', '钦', '庆', '乔', '琼', '琼', '楚', '春', '春'),
    'gj':  ('贾', '詹', '詹', '杰', '金', '金', '吉', '金', '京', '乔', '琼', '琼', '久', '俊', '俊'),
    'hj':  ('亚', '扬', '扬', '耶', '延', '延', '伊', '因', '英', '约', '永', '永', '尤', '云', '云'),
    'st':  ('斯塔', '斯坦', '斯唐', '斯特', '斯滕', '斯滕', '斯蒂', '斯廷', '斯廷',
            '斯托', '斯通', '斯通', '斯图', '斯通', '斯通'),
    'sp':  ('斯帕', '斯潘', '斯庞', '斯佩', '斯彭', '斯彭', '斯皮', '斯平', '斯平',
            '斯波', '斯蓬', '斯蓬', '斯普', '斯蓬', '斯蓬'),
    'sk':  ('斯卡', '斯坎', '斯康', '斯凯', '斯肯', '斯肯', '斯基', '斯金', '斯京',
            '斯科', '斯孔', '斯孔', '斯库', '斯昆', '斯孔'),
    'sm':  ('斯马', '斯曼', '斯芒', '斯梅', '斯门', '斯蒙', '斯米', '斯明', '斯明',
            '斯莫', '斯蒙', '斯蒙', '斯穆', '斯蒙', '斯蒙'),
    'sn':  ('斯纳', '斯南', '斯南', '斯内', '斯嫩', '斯能', '斯尼', '斯宁', '斯宁',
            '斯诺', '斯农', '斯农', '斯努', '斯农', '斯农'),
    'sw':  ('斯瓦', '斯万', '斯旺', '斯韦', '斯文', '斯翁', '斯威', '斯温', '斯温',
            '斯沃', '斯翁', '斯翁', '斯伍', '斯温', '斯翁'),
    'br':  ('布拉', '布兰', '布朗', '布雷', '布伦', '布伦', '布里', '布林', '布林',
            '布罗', '布龙', '布龙', '布鲁', '布伦', '布伦'),
    'cr':  ('克拉', '克兰', '克朗', '克雷', '克伦', '克伦', '克里', '克林', '克林',
            '克罗', '克龙', '克龙', '克鲁', '克伦', '克伦'),
    'dr':  ('德拉', '德兰', '德朗', '德雷', '德伦', '德伦', '德里', '德林', '德林',
            '德罗', '德龙', '德龙', '德鲁', '德伦', '德伦'),
    'fr':  ('弗拉', '弗兰', '弗兰', '弗雷', '弗伦', '弗伦', '弗里', '弗林', '弗林',
            '弗罗', '弗龙', '弗龙', '弗鲁', '弗伦', '弗伦'),
    'gr':  ('格拉', '格兰', '格兰', '格雷', '格伦', '格伦', '格里', '格林', '格林',
            '格罗', '格龙', '格龙', '格鲁', '格伦', '格伦'),
    'pr':  ('普拉', '普兰', '普朗', '普雷', '普伦', '普伦', '普里', '普林', '普林',
            '普罗', '普龙', '普龙', '普鲁', '普伦', '普伦'),
    'tr':  ('特拉', '特兰', '特朗', '特雷', '特伦', '特伦', '特里', '特林', '特林',
            '特罗', '特龙', '特龙', '特鲁', '特伦', '特伦'),
    'vr':  ('弗拉', '弗兰', '弗兰', '弗雷', '弗伦', '弗伦', '弗里', '弗林', '弗林',
            '弗罗', '弗龙', '弗龙', '弗鲁', '弗伦', '弗伦'),
    'bl':  ('布拉', '布兰', '布朗', '布莱', '布伦', '布伦', '布里', '布林', '布林',
            '布洛', '布龙', '布龙', '布鲁', '布伦', '布伦'),
    'cl':  ('克拉', '克兰', '克朗', '克莱', '克伦', '克伦', '克利', '克林', '克林',
            '克洛', '克龙', '克龙', '克鲁', '克伦', '克伦'),
    'fl':  ('弗拉', '弗兰', '弗兰', '弗莱', '弗伦', '弗伦', '弗利', '弗林', '弗林',
            '弗洛', '弗龙', '弗龙', '弗鲁', '弗伦', '弗伦'),
    'gl':  ('格拉', '格兰', '格兰', '格莱', '格伦', '格伦', '格利', '格林', '格林',
            '格洛', '格龙', '格龙', '格鲁', '格伦', '格伦'),
    'pl':  ('普拉', '普兰', '普朗', '普莱', '普伦', '普伦', '普利', '普林', '普林',
            '普洛', '普龙', '普龙', '普鲁', '普伦', '普伦'),
    'sl':  ('斯拉', '斯兰', '斯朗', '斯莱', '斯伦', '斯伦', '斯利', '斯林', '斯林',
            '斯洛', '斯龙', '斯龙', '斯鲁', '斯伦', '斯伦'),
    'tw':  ('特瓦', '特万', '特旺', '特韦', '特文', '特翁', '特威', '特温', '特温',
            '特沃', '特翁', '特翁', '特伍', '特温', '特翁'),
    'dw':  ('德瓦', '德万', '德旺', '德韦', '德文', '德翁', '德威', '德温', '德温',
            '德沃', '德翁', '德翁', '德伍', '德温', '德翁'),
    'kw':  ('夸', '宽', '匡', '克韦', '克文', '克翁', '奎', '克温', '克温',
            '科沃', '克翁', '克翁', '库伍', '克温', '克翁'),
    'gw':  ('瓜', '关', '光', '格韦', '格文', '格翁', '圭', '格温', '格温',
            '戈沃', '格翁', '格翁', '古伍', '格温', '格翁'),
}))

# 合法 onset 清单（用于音节间的辅音簇切分：优先把 th/sh/st 这类连缀整体留给下一音节）
ONSET_INV = set('b c d f g h j k l m n p q r s t v w x y z'.split()) | {
    'sch', 'tsch', 'tch', 'sh', 'ch', 'th', 'ph', 'gh', 'wh', 'kh', 'zh', 'ts', 'dz',
    'gn', 'ny', 'nj', 'll', 'lj', 'rr', 'ss', 'qu', 'gu', 'sc', 'sj', 'kj', 'gj', 'hj',
    'ck', 'br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr', 'vr', 'bl', 'cl', 'fl', 'gl', 'pl',
    'sl', 'st', 'sp', 'sk', 'sm', 'sn', 'sw', 'tw', 'dw', 'kw', 'gw',
}
# 元音独用
VOWEL = {
    'ai': '艾', 'au': '奥', 'ay': '艾', 'ea': '伊', 'ee': '伊', 'ei': '艾', 'eu': '欧',
    'ey': '伊', 'ie': '耶', 'oa': '奥', 'oe': '奥', 'oi': '瓦', 'oo': '乌', 'ou': '乌',
    'oy': '瓦', 'ua': '瓦', 'ue': '韦', 'ui': '维', 'uo': '沃', 'ia': '亚', 'io': '伊奥',
    'a': '阿', 'e': '埃', 'i': '伊', 'o': '奥', 'u': '乌', 'y': '伊',
}
# 音节整体特例（英文/北欧等不规则拼写）
SYL_EXACT = {
    'wan': '万', 'wang': '旺', 'wen': '文', 'win': '温', 'wong': '旺', 'weng': '翁',
    'man': '曼', 'men': '门', 'min': '明', 'mun': '蒙', 'mon': '蒙', 'man': '曼',
    'tan': '坦', 'ten': '滕', 'tin': '廷', 'ton': '顿', 'tun': '通',
    'dan': '丹', 'den': '登', 'din': '丁', 'don': '顿', 'dun': '敦',
    'lan': '兰', 'len': '伦', 'lin': '林', 'lon': '朗', 'lun': '伦',
    'ran': '兰', 'ren': '伦', 'rin': '林', 'ron': '龙', 'run': '伦',
    'san': '桑', 'sen': '森', 'sin': '辛', 'son': '森', 'sun': '孙',
    'ban': '班', 'ben': '本', 'bin': '宾', 'bon': '邦', 'bun': '本',
    'can': '坎', 'cen': '森', 'cin': '辛', 'con': '孔', 'cun': '昆',
    'fan': '凡', 'fen': '芬', 'fin': '芬', 'fon': '丰', 'fun': '丰',
    'gan': '甘', 'gen': '根', 'gin': '金', 'gon': '贡', 'gun': '贡',
    'han': '汉', 'hen': '亨', 'hin': '欣', 'hon': '洪', 'hun': '洪',
    'kan': '坎', 'ken': '肯', 'kin': '金', 'kon': '孔', 'kun': '昆',
    'nan': '南', 'nen': '嫩', 'nin': '宁', 'non': '农', 'nun': '农',
    'pan': '潘', 'pen': '彭', 'pin': '平', 'pon': '蓬', 'pun': '蓬',
    'van': '万', 'ven': '文', 'vin': '文', 'von': '冯', 'vun': '文',
    'yan': '扬', 'yen': '延', 'yin': '因', 'yon': '永', 'yun': '云',
    'zan': '赞', 'zen': '曾', 'zin': '津', 'zon': '宗', 'zun': '尊',
    'ham': '汉', 'man': '曼', 'son': '森', 'ley': '利', 'land': '兰德',
}
# 词尾辅音簇
CODA_CL = {
    'tsk': '茨', 'rts': '尔茨', 'sts': '斯特斯', 'nd': '恩德', 'ld': '尔德',
    'rd': '尔德', 'rt': '尔特', 'lt': '尔特', 'nt': '恩特', 'st': '斯特',
    'nk': '恩克', 'ng': '恩', 'mp': '姆普', 'mb': '姆布', 'sk': '斯克',
    'sh': '什', 'ch': '奇', 'ck': '克', 'ff': '夫', 'll': '尔', 'ss': '斯',
    'tt': '特', 'pp': '普', 'ns': '恩斯', 'ls': '尔斯', 'rs': '尔斯',
    'ms': '姆斯', 'ts': '茨', 'ds': '兹', 'ps': '普斯', 'ks': '克斯',
    'nz': '恩兹', 'rz': '尔茨', 'gn': '尼', 'th': '斯',
    'gh': '赫', 'ph': '夫', 'sm': '斯姆', 'lm': '尔姆', 'rm': '尔姆',
    'zt': '斯特', 'kl': '克尔', 'dl': '德尔', 'tl': '特尔',
    'rl': '尔', 'ml': '姆尔', 'nl': '恩尔', 'bl': '贝尔', 'fl': '费尔',
    'gl': '格尔', 'pl': '普尔', 'sl': '斯尔', 'ln': '尔恩', 'lr': '尔',
    'lv': '尔夫', 'lk': '尔克', 'lp': '尔普', 'lf': '尔夫',
}
# 单辅音尾
CODA1 = {
    'b': '布', 'c': '克', 'd': '德', 'f': '夫', 'g': '格', 'h': '赫', 'k': '克',
    'l': '尔', 'm': '姆', 'n': '恩', 'p': '普', 'r': '尔', 's': '斯', 't': '特',
    'v': '夫', 'w': '夫', 'x': '克斯', 'z': '兹', 'j': '伊',
}
# 双辅音起始中，首字母独立成字
SOLO_ON = {'k': '克', 's': '斯', 'z': '兹', 'd': '德', 't': '特', 'g': '格',
           'f': '弗', 'p': '普', 'b': '布', 'v': '弗', 'c': '克', 'x': '克斯',
           'm': '姆', 'n': '恩', 'r': '尔', 'l': '尔', 'h': '赫', 'j': '伊'}

MAXO = max(len(k) for k in ONSET)
MAXV = max(len(k) for k in VOWEL)


def _dedup(w, lang):
    keep = {'ll', 'rr', 'ss', 'zz'} if lang in ('es', 'pt', 'it') else set()
    out, i = [], 0
    while i < len(w):
        two = w[i:i + 2]
        if len(two) == 2 and two[0] == two[1] and two not in keep:
            out.append(two[0]); i += 2; continue
        out.append(w[i]); i += 1
    return ''.join(out)


def _split_cluster(cons, lang='en'):
    """切分音节间的辅音簇 cons，返回 (coda, onset)。

    核心：优先把 th / sh / st / sch 这类**合法连缀**整体留给后一音节，
    避免 Cristhian -> 「克里斯-特-希-阿-恩」这种错切。
    找不到合法 onset 时，退化为「前面全做尾、最后一个做头」。
    """
    if not cons:
        return '', ''
    # 英语 -rl- 夹在元音间时 r 不单独成字（Darlow=达洛 / Marlow=马洛）
    if lang == 'en' and cons == 'rl':
        return '', 'l'
    for ln in range(min(4, len(cons)), 0, -1):
        cand = cons[len(cons) - ln:]
        if cand in ONSET_INV:
            return cons[:len(cons) - ln], cand
    return cons[:-1], cons[-1]


def _syllables(w, lang='en'):
    """切成 (onset, vowel, coda)。音节间辅音簇交给 _split_cluster 决定归属。"""
    syl, i, n = [], 0, len(w)
    while i < n:
        j = i
        while j < n and w[j] not in 'aeiou':
            j += 1
        if j >= n:
            syl.append((w[i:], '', ''))
            break
        onset = w[i:j]
        k = j
        while k < n and w[k] in 'aeiou':
            k += 1
        vowel = w[j:k]
        m = k
        while m < n and w[m] not in 'aeiou':
            m += 1
        cons = w[k:m]
        if not cons:
            syl.append((onset, vowel, ''))
            i = m
        elif m >= n:
            syl.append((onset, vowel, cons))      # 词尾整块做尾
            break
        else:
            coda, nxt = _split_cluster(cons, lang)
            syl.append((onset, vowel, coda))
            i = m - len(nxt)
    return syl


# 无 onset 的双元音 + 鼻音尾
ONSET_NAS.update({
    'ain': '艾因', 'aing': '昂', 'ein': '艾因', 'eing': '昂',
    'aun': '奥恩', 'aung': '昂', 'eun': '欧恩',
    'oun': '翁', 'oung': '翁', 'uin': '温', 'uing': '翁',
    'ean': '伊恩', 'een': '因', 'ien': '延', 'ion': '伊翁',
    'ian': '扬', 'iang': '扬', 'oan': '万', 'uan': '万',
})


def _render_onv(onset, vowel, lang, nasal=''):
    """onset+vowel(+nasal) -> 中文"""
    if nasal:
        exact = onset + vowel + nasal
        if exact in ONSET_NAS:
            return ONSET_NAS[exact]
        # 元音串尾部与鼻音尾单独成字（Cristhian -> 蒂 + 安，而非「蒂阿恩」）
        for lv in range(1, len(vowel)):
            head, tail = vowel[:lv], vowel[lv:]
            if onset + head in ONSET and tail + nasal in ONSET_NAS:
                return ONSET[onset + head] + ONSET_NAS[tail + nasal]
        # 表内无此组合：退化为「元音 + 鼻音尾」
        return _render_onv(onset, vowel, lang) + ('恩' if nasal in ('n', 'ng') else '')
    if not onset:
        return VOWEL.get(vowel) or (''.join(VOWEL.get(c, '') for c in vowel))
    exact = onset + vowel
    if exact in SYL_EXACT:
        return SYL_EXACT[exact]
    best = None
    for lo in range(min(MAXO, len(onset)), 0, -1):
        o = onset[:lo]
        for lv in range(min(MAXV, len(vowel)), 0, -1):
            v = vowel[:lv]
            if o + v in ONSET:
                best = (o, v, ONSET[o + v]); break
        if best:
            break
    if best:
        o, v, zh = best
        return zh + (_render_onv(onset[len(o):], '', lang) if onset[len(o):] else '') + \
               (_render_onv('', vowel[len(v):], lang) if vowel[len(v):] else '')
    # 无匹配：首字母独立成字，其余继续
    if len(onset) >= 2:
        return SOLO_ON.get(onset[0], '') + _render_onv(onset[1:], vowel, lang)
    if len(onset) == 1:
        return SOLO_ON.get(onset[0], '') + _render_onv('', vowel, lang)
    return ''.join(VOWEL.get(c, '') for c in vowel)


def _render_syl(onset, vowel, coda, lang):
    """整音节渲染：n/ng 尾与元音合并成一个汉字（安/孔/斯坦）。

    尾簇也要先摘出鼻音：Trent 的 'nt' -> 「特伦」+「特」，
    否则会得到「特雷恩特」。
    """
    if coda:
        if coda.startswith('n'):
            if coda.startswith('ng'):
                nas, rest = 'ng', coda[2:]
            else:
                nas, rest = 'n', coda[1:]
            return _render_onv(onset, vowel, lang, nas) + _render_coda(rest)
        if coda.startswith('m') and len(coda) > 1:
            return _render_onv(onset, vowel, lang) + '姆' + _render_coda(coda[1:])
    return _render_onv(onset, vowel, lang) + _render_coda(coda)


def _render_coda(coda):
    if not coda:
        return ''
    if len(coda) == 1:
        return CODA1.get(coda, '')
    if coda in CODA_CL:
        return CODA_CL[coda]
    # 拆：前面部分按簇/单字，最后一个按单字
    for ln in range(min(3, len(coda) - 1), 0, -1):
        head = coda[:ln]
        if head in CODA_CL:
            return CODA_CL[head] + _render_coda(coda[ln:])
    return CODA1.get(coda[0], '') + _render_coda(coda[1:])


_DUP = re.compile(r'([\u4e00-\u9fff])\1')
_DUP2 = re.compile(r'([\u4e00-\u9fff]{2})\1')


def _polish(s):
    """收敛重复音节：卡尔尔->卡尔、查尔尔斯->查尔斯、梅克克尼埃->梅克尼埃。"""
    if not s:
        return s
    for _ in range(3):
        t = _DUP2.sub(r'\1', s)
        t = _DUP.sub(r'\1', t)
        if t == s:
            break
        s = t
    return s


# ================================================================ 权威译名词典
_DICT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'name_dict.json')
SURNAME_ZH, GIVEN_ZH, FULL_ZH = {}, {}, {}
JP_SUR, JP_GIVEN_X, KO_SYL_X, KO_FULL, JP_FULL = {}, {}, {}, {}, {}
if os.path.exists(_DICT_PATH):
    with io.open(_DICT_PATH, encoding='utf-8') as _f:
        _d = json.load(_f)
    for _k, _v in (_d.get('surnames') or {}).items():
        SURNAME_ZH[fold(_k)] = _v
    for _k, _v in (_d.get('given') or {}).items():
        GIVEN_ZH[fold(_k)] = _v
    for _k, _v in (_d.get('full') or {}).items():
        FULL_ZH[fold(_k)] = _v    # 键统一折叠：Marc-André -> marc andre
    JP_SUR = {_k.lower(): _v for _k, _v in (_d.get('jp_surnames') or {}).items()}
    JP_GIVEN_X = _d.get('jp_given_extra') or {}
    KO_SYL_X = _d.get('ko_syl_extra') or {}
    KO_FULL = _d.get('ko_full') or {}
    JP_FULL = _d.get('jp_full') or {}


def translit_word(w, lang='en'):
    w0 = fold(w, slavic=(lang in ('sl', 'east')))
    if not w0:
        return ''
    if w0 in OVERRIDE:
        return OVERRIDE[w0]
    if w0 in NAMES:
        return NAMES[w0]
    if w0 in GIVEN_ZH:
        return GIVEN_ZH[w0]
    if w0 in SURNAME_ZH:
        return SURNAME_ZH[w0]
    if w0 in PARTICLES:
        return PARTICLES[w0]

    w = w0
    # ---------- 语言专属拼读 ----------
    if lang == 'es':
        if w.startswith('ll'):
            w = 'ly' + w[2:]
        elif w.startswith('j'):
            w = 'h' + w[1:]
        w = re.sub(r'z$', 's', w)
        w = re.sub(r'^h', '', w) if w[:2] in ('hu', 'hi') and len(w) > 3 else w
    elif lang == 'pt':
        if w.startswith('j'):
            w = 'zh' + w[1:]
        w = re.sub(r'^h', '', w) if len(w) > 3 else w
        w = re.sub(r'r$', 'r', w)
    elif lang == 'de':
        if w.startswith('w'):
            w = 'v' + w[1:]
        if w.startswith('st'):
            w = 'sht' + w[2:]
        if w.startswith('sp'):
            w = 'shp' + w[2:]
        w = re.sub(r'^ch', 'kh', w)
        w = re.sub(r'z$', 'ts', w)
        w = re.sub(r'^j', 'y', w)
        w = re.sub(r'^v', 'f', w)
    elif lang == 'it':
        if w.startswith('ch'):
            w = 'k' + w[2:]
        elif w.startswith('gh'):
            w = 'g' + w[2:]
        elif w.startswith('gn'):
            w = 'ny' + w[2:]
        elif w.startswith('sc'):
            w = 'sh' + w[2:]
        w = re.sub(r'^h', '', w)
    elif lang == 'fr':
        w = re.sub(r'^ch', 'sh', w)
        w = re.sub(r'^j', 'zh', w)
        w = re.sub(r'(ai|ei)', 'e', w)
        w = re.sub(r'[tdszxp]$', '', w)
        w = re.sub(r'^h', '', w)
    elif lang == 'nl':
        if w.startswith('ij'):
            w = 'ei' + w[2:]
        w = re.sub(r'^sch', 's', w)
        w = re.sub(r'^z', 'z', w)
    elif lang == 'nord':
        if w.startswith('gj'):
            w = 'y' + w[2:]
        w = re.sub(r'^kj', 'sh', w)
        w = re.sub(r'^skj', 'sh', w)
    elif lang == 'sl':
        w = re.sub(r'^w', 'v', w)
        w = re.sub(r'(c)$', 'ts', w)
        w = re.sub(r'^j', 'y', w)
    elif lang == 'east':
        w = re.sub(r'^ye', 'ye', w)
        w = re.sub(r'^kh', 'h', w)
        w = re.sub(r'^g', 'h', w)
    elif lang == 'tr':
        w = re.sub(r'ğ', 'g', w)
        w = re.sub(r'^c', 'j', w)
    elif lang == 'gr':
        w = re.sub(r'^ch', 'h', w)
        w = re.sub(r'^p', 'p', w)

    # ---------- 合并重辅音 ----------
    w = _dedup(w, lang)

    # ---------- 词首静辅音 ----------
    head = ''
    for pre, zh in (('mb', '姆'), ('mn', '姆'), ('kn', '克'), ('gn', '格'),
                    ('pn', '普'), ('wr', '尔'), ('ps', '普')):
        if w.startswith(pre) and len(w) > len(pre) + 1:
            head, w = zh, w[len(pre) - 1:]
            break

    # ---------- 元音合并 ----------
    w = re.sub(r'aa', 'a', w)
    w = re.sub(r'(?<!^)ii', 'i', w)
    w = re.sub(r'uu', 'u', w)
    if lang != 'en':
        w = re.sub(r'ee', 'i', w)
    else:
        # 英语词尾 -ow 是双元音（Darlow=达洛），不是「奥夫」
        w = re.sub(r'ow$', 'o', w)
        w = re.sub(r'ew$', 'u', w)
    # 日耳曼语系词尾 w 不发音（Darlow/Brandw）
    if lang in ('en', 'nl', 'de', 'nord') and w.endswith('w') and len(w) > 3:
        w = w[:-1]

    # ---------- 音节渲染 ----------
    syl = _syllables(w, lang)
    out = []
    for idx, (on, vo, co) in enumerate(syl):
        if not vo:                       # 纯辅音尾段
            out.append(_render_coda(on))
            continue
        out.append(_render_syl(on, vo, co, lang))
    body = _polish(''.join(out))
    if not body:
        return w0
    return head + body


# ================================================================ 前缀词
PARTICLES = {
    'de': '德', 'del': '德尔', 'della': '德拉', 'di': '迪', 'da': '达', 'do': '多',
    'dos': '多斯', 'das': '达斯', 'du': '杜', 'la': '拉', 'le': '勒', 'les': '莱斯',
    'van': '范', 'der': '德', 'den': '登', 'von': '冯', 'ten': '滕', 'ter': '特尔',
    'el': '埃尔', 'al': '阿尔', 'bin': '本', 'ibn': '伊本', 'ben': '本', 'bar': '巴尔',
    'mac': '麦克', 'mc': '麦克', 'abu': '阿布', 'abd': '阿卜杜', 'abdul': '阿卜杜勒',
    'abdallah': '阿卜杜拉', 'st': '圣', 'saint': '圣', 'o': '奥', 'ap': '阿普',
}

# 连写虚词：仅收录「不会单独作为教名出现」的前缀，避免把 拉明/奥马尔/弗洛里安 这类教名误并
SOFT_HEADS = {
    '范', '冯', '德', '登', '滕', '特尔', '德尔', '德拉', '迪', '达', '多', '杜',
    '勒', '埃尔', '阿尔', '本', '伊本', '麦克', '巴尔', '圣', '阿布',
    '阿卜杜', '阿卜杜勒', '多斯', '达斯',
}

# ================================================================ 固定人名
NAMES = {
    'kevin': '凯文', 'erling': '埃尔林', 'harry': '哈里', 'john': '约翰', 'james': '詹姆斯',
    'michael': '迈克尔', 'david': '大卫', 'paul': '保罗', 'peter': '彼得', 'mark': '马克',
    'luke': '卢克', 'jack': '杰克', 'joe': '乔', 'joseph': '约瑟夫', 'sam': '萨姆',
    'william': '威廉', 'george': '乔治', 'thomas': '托马斯', 'daniel': '丹尼尔',
    'alexander': '亚历山大', 'benjamin': '本杰明', 'matthew': '马修', 'andrew': '安德鲁',
    'anthony': '安东尼', 'chris': '克里斯', 'christopher': '克里斯托弗',
    'philip': '菲利普', 'stephen': '斯蒂芬', 'steven': '史蒂文', 'robert': '罗伯特',
    'richard': '理查德', 'edward': '爱德华', 'charles': '查尔斯', 'henry': '亨利',
    'oliver': '奥利弗', 'leo': '莱奥', 'lionel': '利昂内尔', 'cristiano': '克里斯蒂亚诺',
    'kylian': '基利安', 'luka': '卢卡', 'marc': '马克', 'nico': '尼科', 'rayan': '拉扬',
    'phil': '菲尔', 'omar': '奥马尔', 'mohamed': '穆罕默德', 'mohammed': '穆罕默德',
    'muhammad': '穆罕默德', 'amine': '阿明', 'youssef': '优素福', 'ibrahim': '易卜拉欣',
    'karim': '卡里姆', 'achraf': '阿什拉夫', 'sofyan': '索菲扬', 'brahim': '卜拉欣',
    'alphonso': '阿方索', 'jonathan': '乔纳森', 'gabriel': '加布里埃尔',
    'vinicius': '维尼修斯', 'rodrygo': '罗德里戈', 'raphael': '拉斐尔',
    'eduardo': '爱德华多', 'pedro': '佩德罗', 'carlos': '卡洛斯', 'miguel': '米格尔',
    'sergio': '塞尔吉奥', 'fernando': '费尔南多', 'alejandro': '亚历杭德罗',
    'nicolas': '尼古拉斯', 'lucas': '卢卡斯', 'mateo': '马特奥', 'matteo': '马特奥',
    'diego': '迭戈', 'francisco': '弗朗西斯科', 'javier': '哈维尔', 'manuel': '曼努埃尔',
    'andres': '安德烈斯', 'sebastian': '塞巴斯蒂安', 'julian': '胡利安',
    'marco': '马尔科', 'alessandro': '亚历山德罗', 'giorgio': '乔治', 'lorenzo': '洛伦佐',
    'francesco': '弗朗切斯科', 'andrea': '安德烈亚', 'giovanni': '乔瓦尼',
    'matthias': '马蒂亚斯', 'maximilian': '马克西米利安', 'lukas': '卢卡斯',
    'florian': '弗洛里安', 'niklas': '尼克拉斯', 'jonas': '约纳斯', 'felix': '费利克斯',
    'antoine': '安托万', 'olivier': '奥利维耶', 'julien': '朱利安',
    'maxime': '马克西姆', 'enzo': '恩佐', 'marcus': '马库斯', 'bukayo': '布卡约',
    'declan': '德克兰', 'jude': '裘德', 'vincent': '文森特', 'simon': '西蒙',
    'martin': '马丁', 'victor': '维克托', 'adam': '亚当', 'oscar': '奥斯卡',
    'hugo': '雨果', 'emil': '埃米尔', 'jean': '让', 'juan': '胡安', 'jose': '何塞',
    'joao': '若昂', 'luis': '路易斯', 'rafael': '拉斐尔', 'bruno': '布鲁诺',
    'mario': '马里奥', 'alberto': '阿尔贝托', 'roberto': '罗伯托', 'ricardo': '里卡多',
    'antonio': '安东尼奥', 'alvaro': '阿尔瓦罗', 'adrian': '阿德里安', 'ruben': '鲁本',
    'raul': '劳尔', 'iker': '伊克尔', 'unai': '乌奈', 'aitor': '艾托尔',
    'inaki': '伊尼亚基', 'mikel': '米克尔', 'aymeric': '艾梅里克',
    'ousmane': '乌斯曼', 'ibrahima': '易卜拉希马', 'amadou': '阿马杜', 'moussa': '穆萨',
    'sekou': '塞库', 'cheikh': '谢赫', 'mamadou': '马马杜', 'lamine': '拉明',
    'kalidou': '卡利杜', 'sadio': '萨迪奥', 'edouard': '爱德华',
    'othman': '奥斯曼', 'anas': '阿纳斯', 'bilal': '比拉勒',
    'musiala': '穆西亚拉', 'jamal': '贾马尔', 'joshua': '约书亚', 'ronald': '罗纳德',
    'virgil': '维吉尔', 'serge': '塞尔日', 'marcelo': '马塞洛', 'rafael': '拉斐尔',
    'alisson': '阿利松', 'ederson': '埃德森', 'casemiro': '卡塞米罗',
    'vinicius': '维尼修斯', 'rodrygo': '罗德里戈', 'endrick': '恩德里克',
    'raphinha': '拉菲尼亚', 'richarlison': '理查利森', 'antony': '安东尼',
    'gabriel': '加布里埃尔', 'martinelli': '马丁内利', 'jesus': '热苏斯',
    'fernandinho': '费尔南迪尼奥', 'marquinhos': '马尔基尼奥斯',
    'danilo': '达尼洛', 'alexsandro': '阿莱士·桑德罗', 'bremer': '布雷默',
    'lautaro': '劳塔罗', 'julian': '胡利安', 'alvarez': '阿尔瓦雷斯',
    'mac allister': '麦卡利斯特', 'macallister': '麦卡利斯特',
    'enzo': '恩佐', 'paredes': '帕雷德斯', 'tagliafico': '塔利亚菲科',
    'molina': '莫利纳', 'romero': '罗梅罗', 'martinez': '马丁内斯',
    'dybala': '迪巴拉', 'garnacho': '加纳乔', 'buonanotte': '博纳诺特',
    'almada': '阿尔马达', 'otamendi': '奥塔门迪', 'acuna': '阿库尼亚',
    'valverde': '巴尔韦德', 'nunez': '努涅斯', 'bentancur': '本坦库尔',
    'ugarte': '乌加特', 'araujo': '阿劳若', 'pellistri': '佩利斯特里',
    'de la cruz': '德拉科鲁斯', 'vecino': '贝西诺', 'caceres': '卡塞雷斯',
}

# ================================================================ 权威译名覆盖表（中文媒体通用写法）
OVERRIDE = {}


# ================================================================ 韩日姓名
# 韩国姓氏罗马字 -> 汉字
KO_SUR = {
    'kim': '金', 'lee': '李', 'yi': '李', 'ri': '李', 'park': '朴', 'pak': '朴',
    'choi': '崔', 'choe': '崔', 'jung': '郑', 'jeong': '郑', 'chung': '郑', 'cheong': '郑',
    'kang': '姜', 'gang': '姜', 'cho': '赵', 'jo': '赵', 'yoon': '尹', 'yun': '尹',
    'jang': '张', 'chang': '张', 'lim': '林', 'im': '林', 'rim': '林', 'han': '韩',
    'oh': '吴', 'o': '吴', 'seo': '徐', 'suh': '徐', 'shin': '申', 'sin': '申',
    'kwon': '权', 'gwon': '权', 'hwang': '黄', 'ahn': '安', 'an': '安',
    'song': '宋', 'hong': '洪', 'ryu': '柳', 'yu': '柳', 'yoo': '俞', 'jeon': '全',
    'jun': '全', 'chon': '全', 'ko': '高', 'go': '高', 'min': '闵', 'bae': '裴',
    'nam': '南', 'son': '孙', 'sohn': '孙', 'no': '卢', 'noh': '卢', 'ha': '河',
    'shim': '沈', 'sim': '沈', 'moon': '文', 'mun': '文', 'baek': '白', 'paek': '白',
    'heo': '许', 'hur': '许', 'gu': '具', 'koo': '具', 'yang': '梁', 'cha': '车',
    'chu': '秋', 'choo': '秋', 'woo': '禹', 'wu': '禹', 'kwak': '郭', 'gwak': '郭',
    'seong': '成', 'sung': '成', 'cha': '车', 'pyo': '表', 'ma': '马', 'jin': '陈',
    'jae': '才', 'eom': '严', 'um': '严', 'won': '元', 'bang': '方', 'gong': '孔',
    'kong': '孔', 'hyun': '玄', 'hyeon': '玄', 'myung': '明', 'myeong': '明',
    'ki': '奇', 'gi': '奇', 'namgung': '南宫', 'sun': '鲜于', 'seok': '石', 'suk': '石',
}
# 韩国名字音节罗马字 -> 汉字（音译惯用字）
KO_SYL = {
    'bum': '范', 'beom': '范', 'keun': '根', 'geun': '根', 'heon': '宪', 'hun': '勋',
    'hoon': '勋', 'woo': '祐', 'wu': '祐', 'u': '祐', 'chang': '昌', 'seung': '承',
    'hyun': '贤', 'hyeon': '贤', 'ji': '智', 'hyuk': '赫', 'hyeok': '赫', 'chan': '灿',
    'yong': '龙', 'ryong': '龙', 'rae': '来', 'san': '相', 'sang': '相', 'taek': '泽',
    'ju': '珠', 'joo': '珠', 'eun': '恩', 'jin': '镇', 'chin': '镇', 'ho': '浩',
    'dong': '东', 'jung': '正', 'jeong': '正', 'yu': '裕', 'bon': '本', 'su': '洙',
    'soo': '洙', 'min': '敏', 'kyu': '圭', 'gyu': '圭', 'jae': '在', 'bin': '彬',
    'been': '彬', 'hwan': '焕', 'tae': '泰', 'young': '荣', 'yeong': '荣',
    'jong': '钟', 'sung': '成', 'seong': '成', 'won': '元', 'yoon': '润', 'yun': '润',
    'seok': '锡', 'suk': '锡', 'il': '一', 'dae': '大', 'guk': '国', 'kuk': '国',
    'bok': '福', 'ki': '基', 'gi': '基', 'sik': '植', 'shik': '植', 'chul': '哲',
    'cheol': '哲', 'nam': '南', 'gwang': '光', 'kwang': '光', 'myung': '明',
    'myeong': '明', 'byeong': '炳', 'byung': '炳', 'won': '元', 'yeon': '妍',
    'ji': '智', 'ha': '河', 'na': '娜', 'mi': '美', 'ye': '艺', 'so': '昭',
    'hyang': '香', 'sun': '顺', 'ok': '玉', 'jin': '珍', 'ah': '雅',
    'gang': '刚', 'kang': '刚', 'rae': '来', 'sol': '率', 'hae': '海', 'rim': '林',
    'ryu': '柳', 'young': '永', 'in': '仁', 'jung': '中', 'wook': '旭', 'uk': '旭',
    'seop': '燮', 'sub': '燮', 'yub': '烨', 'yeop': '烨', 'hyeop': '协',
    'haeng': '行', 'do': '度', 'eui': '义', 'ui': '义', 'won': '远', 'je': '济',
    'jae': '载', 'gwon': '权', 'hoe': '会', 'heo': '许', 'won': '原',
}
# 日本名字罗马字 -> 汉字
JP_GIVEN = {
    'takefusa': '建英', 'wataru': '航', 'kaoru': '薰', 'daichi': '大地', 'takumi': '匠',
    'takuma': '琢磨', 'takuro': '拓郎', 'ryo': '亮', 'ryota': '亮太', 'ryosuke': '亮佑',
    'yuto': '悠斗', 'yuki': '悠纪', 'yuma': '悠真', 'yusuke': '祐介', 'yuya': '悠也',
    'ayase': '绫濑', 'ao': '碧', 'hidemasa': '英正', 'junya': '纯也', 'koki': '康树',
    'keito': '庆人', 'kokoro': '心', 'shuto': '秀人', 'hayao': '隼', 'hiroki': '大贵',
    'hiroshi': '浩', 'hidetoshi': '英寿', 'keisuke': '启介', 'kazuya': '和也',
    'kazuki': '和树', 'kazuma': '和真', 'ken': '健', 'kenta': '健太', 'kento': '健人',
    'kenji': '健司', 'koji': '浩二', 'kohei': '康平', 'kosuke': '康介', 'masato': '真人',
    'masaya': '雅也', 'masashi': '雅史', 'maya': '真也', 'mei': '芽衣', 'naoki': '直树',
    'naoto': '直人', 'naoya': '直也', 'nobuyuki': '信之', 'ryusei': '龙生',
    'satoshi': '聪', 'shinji': '慎司', 'shogo': '祥悟', 'shota': '翔太',
    'shunsuke': '俊介', 'sota': '苍太', 'tadanari': '忠成', 'takahiro': '贵宏',
    'takashi': '隆', 'takayuki': '孝行', 'takuya': '拓也', 'tatsuya': '达也',
    'tetsuya': '哲也', 'toshihiro': '俊宏', 'tsubasa': '翼', 'yasuaki': '泰明',
    'yasuhito': '康仁', 'yoshinori': '义德', 'yuji': '雄二', 'yuki': '悠纪',
    'yuto': '悠斗', 'yutaka': '丰', 'atsuto': '笃人', 'gaku': '岳', 'gensho': '玄翔',
    'hayate': '飒', 'ikuma': '生真', 'jun': '淳', 'kaito': '海斗', 'kakeru': '翔',
    'katsuya': '克也', 'keigo': '启悟', 'kotaro': '小太郎', 'kyogo': '恭吾',
    'makoto': '诚', 'mitsuru': '满', 'nobuhiro': '信弘', 'osamu': '修',
    'ren': '莲', 'riku': '陆', 'ryu': '龙', 'ryuji': '龙二', 'seiya': '星矢',
    'shinya': '真也', 'shu': '秀', 'shumpei': '俊平', 'so': '奏', 'taichi': '太一',
    'taiga': '大河', 'taishi': '太志', 'takao': '隆夫', 'takeshi': '武',
    'taro': '太郎', 'toma': '斗真', 'tomoya': '智也', 'toru': '彻', 'tsuyoshi': '刚',
    'yoshiki': '良树', 'yoshito': '义人', 'yuto': '悠人', 'yuya': '优也',
    'zento': '善斗', 'sei': '圣', 'sena': '濑名', 'asahi': '朝日', 'hinata': '日向',
}


def _ko_zh(parts):
    """韩文姓名（罗马字）-> 汉字"""
    if not parts:
        return ''
    low = [p.lower() for p in parts]
    sur = giv = None
    if low[-1] in KO_SUR or low[-1] in SURNAME_ZH:     # 西式：名在前
        sur, giv = low[-1], low[:-1]
    elif low[0] in KO_SUR or low[0] in SURNAME_ZH:     # 韩式：姓在前
        sur, giv = low[0], low[1:]
    if not sur:
        return to_zh(' '.join(parts), '')
    out = KO_SUR.get(sur) or SURNAME_ZH.get(sur) or ''
    for g in giv:
        gy = re.sub(r'[^a-z]', '', g)
        if not gy:
            continue
        # 连写名字按音节表切分；无法切分则整体查表
        if gy in KO_SYL_X:
            out += KO_SYL_X[gy]; continue
        if gy in KO_SYL:
            out += KO_SYL[gy]; continue
        got, i = '', 0
        while i < len(gy):
            hit = None
            for ln in (4, 3, 2, 1):
                seg = gy[i:i + ln]
                if seg in KO_SYL_X or seg in KO_SYL:
                    hit = (seg, KO_SYL_X.get(seg) or KO_SYL[seg]); break
            if hit:
                got += hit[1]; i += len(hit[0])
            else:
                i += 1
        out += got or translit_word(gy, 'ko')   # 兜底：走通用引擎，绝不残留拉丁字母
    return out


def _jp_zh(parts):
    """日文姓名（罗马字）-> 汉字；中文习惯「姓+名」连写（远藤航）。"""
    if not parts:
        return ''
    low = [p.lower() for p in parts]
    sur_i = next((i for i, p in enumerate(low) if p in JP_SUR or p in SURNAME_ZH), None)
    if sur_i is None:
        return '·'.join(translit_word(p, 'jp') for p in low)
    sur = JP_SUR.get(low[sur_i]) or SURNAME_ZH[low[sur_i]]
    givs = [low[i] for i in range(len(low)) if i != sur_i]
    out = sur
    for g in givs:
        out += JP_GIVEN_X.get(g) or JP_GIVEN.get(g) or translit_word(g, 'jp')
    return out


def _word_zh(tok, lang):
    """单个词条：连字符分词后逐段音译，保留连字符（亚历山大-阿诺德）"""
    if '-' in tok:
        segs = [s for s in tok.split('-') if s]
        return '-'.join(translit_word(s, lang) for s in segs)
    return translit_word(tok, lang)


def to_zh(name, cit='', sep='·'):
    if not name:
        return ''
    name = re.sub(r'\s+', ' ', name).strip()
    if not name:
        return ''
    if re.search(r'[\u4e00-\u9fff]', name):
        return name
    parts = [p for p in re.split(r'\s+', name) if p]
    if not parts:
        return name
    low = ' '.join(parts).lower()
    lowf = fold(low)
    rev = ' '.join(reversed(parts)).lower()     # 西方来源常写成「名 姓」，日韩词典需双向匹配
    revf = fold(rev)
    for cand in (lowf, revf, low, rev):
        if cand in FULL_ZH:
            return FULL_ZH[cand]
    for cand in (low, lowf, rev, revf):
        if cand in KO_FULL:
            return KO_FULL[cand]
    for cand in (low, lowf, rev, revf):
        if cand in JP_FULL:
            return JP_FULL[cand]
    lang = lang_of(cit)
    if lang == 'kr':
        return _ko_zh(parts) or name
    if lang == 'jp':
        return _jp_zh(parts) or name
    zh = [_word_zh(p, lang) for p in parts]
    zh = [z for z in zh if z]
    if not zh:
        return name
    if len(zh) == 1:
        return zh[0]
    # 虚词连写：van/de/der/di/el 等前缀与其后的姓连成一个整体，组间用 sep 分隔
    # 例：Virgil van Dijk -> 维吉尔·范迪克；Micky van de Ven -> 米基·范德文
    groups, opens = [], []
    for p in zh:
        if groups and opens[-1]:
            groups[-1] += p
            opens[-1] = p in SOFT_HEADS
        else:
            groups.append(p)
            opens.append(p in SOFT_HEADS)
    return sep.join(groups)
