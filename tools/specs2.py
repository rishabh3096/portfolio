def X(pid, s): return [x.strip().replace('~', pid + '.') for x in s.split(',')]
def rows(pid, s): return [X(pid, r) for r in s.split('|')]
BL_GRID = "94baec119906955.60ae1ee68b2da.jpg | ba8e83119906955.60ae1ee689334.jpg | 1b9c2c119906955.60ae1ee693dd9.jpg | c4b29c119906955.60ae1ee696084.jpg | 6c8e2e119906955.60ae1ee68de9c.jpg | af6f7a119906955.60ae1ee68e3a6.jpg | aebe89119906955.60ae1ee686761.jpg | 2c4677119906955.60ae1ee68600a.jpg | e71b6b119906955.60ae1ee688487.jpg | 952818119906955.60ae1ee6990e0.jpg | 97c9ee119906955.60ae1ee68589e.jpg | d3a841119906955.60ae1ee694761.jpg | 209208119906955.60ae1ee688e90.jpg | d35372119906955.60ae1ee68c786.jpg | 727a85119906955.60ae1ee68ff3f.jpg | 391088119906955.60ae1ee695032.jpg | 2c7911119906955.60ae1ee689f31.jpg | ec4021119906955.60ae1ee688944.jpg | 382df6119906955.60ae1ee689a68.jpg | 9616b7119906955.60ae1ee686ccd.jpg | 7e5c6c119906955.60ae1ee6873fe.jpg | af0b74119906955.60ae1ee68f813.jpg | 5ebbc3119906955.60ae1ee68bae6.jpg | 87f83b119906955.60ae1ee68a754.jpg | f733be119906955.60ae1ee68ce8b.jpg | 606b06119906955.60ae1ee68e94f.jpg | fc9dcc119906955.60ae1ee68c1fd.jpg | 0c3cda119906955.60ae1ee687be4.jpg | a31d07119906955.60ae1ee68ac64.jpg | bf5d97119906955.60ae1ee691db6.jpg | 215639119906955.60ae1ee6907d9.jpg | 7f9661119906955.60ae1ee68d32d.jpg | 3d4ffe119906955.60ae1ee6998b5.jpg | b89645119906955.60ae1ee6971fa.jpg | 9389a3119906955.60ae1ee68d853.jpg | f30541119906955.60ae1ee69898a.jpg | 10ac10119906955.60ae1ee6978bf.jpg | 61b230119906955.60ae1ee68eebb.jpg | 8d7799119906955.60ae1ee69a908.jpg | e1a40e119906955.60ae1ee6915d0.jpg | 3f9970119906955.60ae1ee6924d4.jpg | f361d7119906955.60ae1ee69362e.jpg | 4669c4119906955.60ae1ee690f4a.jpg | 645e2a119906955.60ae1ee692cc2.jpg | 4bdfcc119906955.60ae1ee69a11f.jpg | a3981b119906955.60ae1ee696943.jpg | 63930a119906955.60ae1ee69590c.jpg | ecf4e3119906955.60ae1ee6981d9.jpg".split(' | ')
BL = '119906955'
def g(*ids): return ('i', ids[0])
SPECS2 = {
 'boat-lifestyle': [('i', x) for x in ['bc88b8119906955.60a6f1fed274e.gif','4a34da119906955.60a6f1fed2218.gif','3645eb119906955.60a70bac2c19c.gif','91e53f119906955.60a70bac2b9c1.gif','fb6cf5119906955.60a822a6d34de.gif']]
   + [('vm','553734584'),('i','16bab7119906955.60a847fdc58ea.gif'),('vm','553784975'),('vm','553802721'),('vm','553788953'),('vm','553917806'),
      ('i','4b0b5a119906955.60a99d753c1fc.gif'),('i','beab9c119906955.60aa51ddeb772.gif'),('vm','553935697'),('i','7d365e119906955.60aaa1368093c.jpg'),
      ('i','0c3656119906955.60aaac98d97d3.gif'),('i','0535c7119906955.60aaaea5943d6.gif'),('vm','555002705'),('vm','555001771'),('i','ecdff8119906955.60aaa13681061.gif'),
      ('i','be3e46119906955.60aabca0e1897.jpg'),('vm','554046199'),('i','45e631119906955.60aacfd78a46b.gif'),('i','759637119906955.60ae13f3c5781.gif'),
      ('i','3a2476119906955.60ae13f3c6738.gif'),('i','7a1783119906955.60ae13f3c5e5c.gif'),('i','50ba40119906955.60aac69f8e193.gif'),('vm','554248033'),
      ('i','d99652119906955.60acdf8539504.gif'),('vm','554993075'),('i','7aa3c1119906955.60ae1820e387e.gif'),('i','5ff418119906955.60ae1e40d8f8e.gif'),
      ('i','662b85119906955.60ae1820e3005.jpg'),('g',[BL_GRID[i:i+4] for i in range(0,48,4)]),('i','f55e74119906955.60ae213046ce7.gif')],
 'lunar-vista': [('i', x) for x in ['472e47247874183.69e516f790581.png','11db56247874183.69e516f792ab9.gif','806bbb247874183.69e516f7931e4.gif','e8acf4247874183.69e516f7916ae.jpg',
   '1b80d5247874183.69e516f791005.gif','175dd3247874183.69e516f790c94.jpg','be4a31247874183.69e516f793962.gif','968ca6247874183.69e516f792e25.jpg','66cf31247874183.69e516f793554.gif',
   'db386b247874183.69e516f791352.jpg','7dea14247874183.69e516f792651.jpg','dafebe247874183.69e516f793d1e.gif','16a3c4247874183.69e516f790932.jpg','2ee30f247874183.69e516f791a48.jpg',
   '1de106247874183.69e516f79222a.jpg','94157b247874183.69e516f791e97.gif']],
 'watch-storm': [('i', x) for x in ['ec898e107910573.5fb25fb500892.jpg','0833ce107910573.5fb25fb5027a5.jpg','f83330107910573.5fb27a65e0067.jpg','fb3bfe107910573.5fb25fb501f8e.jpg',
   'cc1a02107910573.5fb25fb50309c.jpg','9010b9107910573.5fb25fb50192a.jpg']] + [('film','assets/films/watch-storm.mp4')]
   + [('i', x) for x in ['5fae7e107910573.5fb2790b1465a.gif','26f285107910573.5fb2790b150ee.jpg','c83109107910573.5fb2790b156f8.jpg']],
 'brewery-food-menu': [('i', x) for x in ['5ee66385009049.5d6ee083554d8.jpg','2edd2585009049.5d6fa6e310de1.jpg','71f8fe85009049.5d6fa6e310777.jpg']],
 'ideatic-social': [('i', x) for x in ['4d8dbd84008137.5d4dd5c5180ab.gif','fcb8aa84008137.5d4e95b066b93.gif','ca7a3b84008137.5d4f080c15e3c.gif','b5524884008137.5d4f080c15a2c.jpg',
   'e39ec384008137.5d4f09d0952b5.gif','a507ce84008137.5d4f09d094ce8.gif','0d73f084008137.5d4f11e973b8f.gif','2c5ba084008137.5d4f5c8870f36.gif','08025784008137.5d500d5d03687.gif',
   'd65ebc84008137.5d500d5d03072.gif','f5541784008137.5d500d5d03aae.gif','8c2f7384008137.5d7976075e896.gif','10fa8384008137.5d7976075e1a7.gif']]
   + [('link','https://www.facebook.com/soi7pub/videos/455158488367729/','Watch the film on Facebook ↗︎')]
   + [('i', x) for x in ['a8802b84008137.5d7d4bd0b4ec2.png','38788184008137.5d7d52029bc36.gif','87508484008137.5d7d52029b6f5.gif']],
 'photo-manipulations': [('i','3d4c1472505893.5be9e80174cb5.jpg'),('t','Drifting Away 🌊'),('i','b5a63372505893.5be9e801752c1.jpg'),('t','Lost ☁️⛰️'),
   ('i','d0368672505893.5be9e80175af1.jpg'),('t','Absolut 🍶'),('i','8cabb472505893.5be9e8017614a.jpg'),('t','Independence Day 🇮🇳'),
   ('g', rows('72505893', """33afd3~5be9e7ffdb3da.jpg,6d0a19~5be9e7ffdf9cb.jpg,b676e2~5be9e7ffe05e7.jpg,ba70fe~5be9e7ffdda84.jpg,99d0fa~5be9e7ffe0c8d.jpg,dc9de8~5be9e7ffdc84c.jpg|783490~5be9e7ffda29a.jpg,cc2578~5be9e7ffe233e.jpg,5365e4~5be9e7ffe1ca5.jpg,f2163b~5be9e7ffdb8d3.jpg,3edc1b~5be9e7ffdc34e.jpg,6a5c17~5be9e7ffdbd1f.jpg|e7147f~5be9e7ffda7b6.jpg,ba4446~5be9e7ffe1098.jpg,2e6c9f~5be9e7ffddfab.jpg,08aa29~5be9e7ffdf0b9.jpg,c75a68~5be9e7ffde3cc.jpg|d4771e~5be9e7ffdead2.jpg,f5cb32~5be9e7ffdce2d.jpg,4391a2~5be9e7ffe00c6.jpg,945282~5be9e7ffe16b4.jpg,a0709d~5be9e7ffdadcd.jpg,0028bd~5be9e7ffe2951.jpg|45e8ee~5be9e7ffdf4c2.jpg,a6a61f~5be9e7ffdd468.jpg,ce31cf~5be9e7ffe4304.jpg,951367~5be9e7ffe5d3b.jpg,dfc53a~5be9e7ffe510b.jpg,fded36~5be9e7ffe3e1a.jpg|6456f5~5be9e7ffe3380.jpg,5205fa~5be9e7ffe470c.jpg,5a2747~5be9e7ffe2d99.jpg,0abfbc~5be9e7ffe4cef.jpg,81cda5~5be9e7ffe5732.jpg|a9fd76~5be9e7ffe6367.jpg,de7d15~5be9e7ffe37a1.jpg,865278~5d0d090c5a37d.jpg,693a91~5d0d090c5c545.jpg,d0a4f5~5d0d090c59fba.jpg,ea1862~5d0d090c5a730.jpg|e36ed3~5d0d090c5e172.jpg,b30de0~5d0d090c5b7a2.jpg,a450da~5d0d090c5bf41.jpg,430b84~5d0d090c5cb09.jpg,019dde~5d0d090c5ced9.jpg,984869~5d0d090c5df62.jpg|4a90c9~5d0d090c5e536.jpg,06efa4~5d0d090c5ad77.jpg,b9ff9d~5d0d090c5c285.jpg,f89e01~5d0d090c5d295.jpg,20721e~5d0d090c5d64b.jpg,54568d~5d0d090c5ec5a.jpg|7489a6~5d0d090c59d47.jpg,d1bddc~5d0d090c5b3ec.jpg,c12481~5d0d090c5db63.jpg,6cddd5~5d0d090c5b146.jpg,9d7afd~5d0d090c5bb60.jpg,229fea~5d0d090c5c90e.jpg|a749c6~5d0d090c5a930.jpg,e2937e~5d0d090c5d84a.jpg,bccc69~5d0d090c5e908.jpg,f313c8~5d0d090c5fde3.jpg,d47481~5d0d090c60dec.jpg|0c26da~5d0d090c601b6.jpg,a7538c~5d0d090c5f6c8.jpg,fde6bb~5d0d090c60808.jpg,58ff2d~5d0d090c6043d.jpg,4e932b~5d0d090c60b31.jpg,b6232d~5d0d090c611b6.jpg|798fdd~5d0d090c5faaa.jpg,943459~5d0d090c5eed4.jpg,8ebaae~5d0d090c5f2a8.jpg,e8a956~5d0d090c61587.jpg""")),
   ('i','9c94ce72505893.5d0d0910d70d3.jpg'),('link','https://www.instagram.com/rishhh.x/','More on Instagram, @rishhh.x ↗︎'),('t','Thank you!')],
}
F = '69374201'
def fifa():
    seq = """i d3e7f9~5b7ec3ac70e2b.jpg
i 44f66d~5b7ec3ac6f5cb.jpg
i ca6739~5b7ef6b8c6825.jpg
i de67b5~5b7ef6b8c5a67.jpg
g 6fa16a~5b7ec3aaaeb84.jpg,2f8995~5b7ec3aaad944.jpg,1a1bfa~5b7ef6b7353a3.jpg | 81ddaf~5b7ec3aaae59c.jpg,592a02~5b7ec3aaaef4f.jpg,1acde6~5b7ec3aaadfca.jpg
i f84168~5b7ec3ac6ed99.jpg
g 0c1604~5b7ec3ab27dae.jpg,487e09~5b7ef6b7a58e9.jpg,dbddde~5b7ec3ab282ab.jpg | 565dd7~5b7ec3ab269d0.jpg,ccf8c3~5b7ec3ab275d8.jpg,cac3b7~5b7ec3ab271ed.jpg
i dbe641~5b7ec3ac6e8d2.jpg
g afb5c6~5b7ec3ab8c99c.jpg,d7abd5~5b7ec3ab8cd8c.jpg,6fc788~5b7ec3ab8b7ee.jpg | 3dc9ae~5b7ec3ab8c1c7.jpg,b3175d~5b7ec3ab8b3db.jpg,592ef7~5b7ec3ab8bdaa.jpg
i 6d1937~5b7ec3ac70067.jpg
g d161b4~5b7ec3abeb561.jpg,407328~5b7ec3abec1af.jpg,7a76cd~5b7ec3abeafa6.jpg | a89280~5b7ec3abec805.jpg,55626f~5b7ef6b80ff17.jpg,1772bc~5b7ec3abebb42.jpg
i 9d48e0~5b7ec5e6a673c.jpg
g be8d86~5b7ec5e5901b9.jpg,1b33cf~5b7ec5e591a65.jpg,83b4c2~5b7ec5e590ccc.jpg | 59dcd8~5b7ec5e58fbd6.jpg,3478b7~5b7ec5e590703.jpg,283118~5b7ec5e5913a5.jpg
i f2d5d3~5b7ec5e6a6245.jpg
g 0c6881~5b7ec5e647f37.jpg,4da2c2~5b7ec5e64782a.jpg,593b39~5b7ec5e648bcb.jpg | f4c09e~5b7ec5e646d14.jpg,cc7768~5b7ec5e64868b.jpg,a971a2~5b7ec5e647295.jpg
i 46fe17~5b7ec65149920.jpg
g a31252~5b7ece211f25c.jpg,fe5ad0~5b7ece211e805.jpg,aebc21~5b7ece211e1e6.jpg | a5a9c9~5b7ece211d836.jpg,92cdf0~5b7ece211ddcd.jpg,093bfc~5b7ece211ed9e.jpg
i 76d444~5b7ece23ae86c.jpg
g 8e2bb0~5b7ece21c5bb7.jpg,48d473~5b7ece21c7394.jpg,65feb2~5b7ef6b84bba0.jpg | c5c55a~5b7ef6b84b659.jpg,b0fa05~5b7ece21c63f9.jpg,a7867c~5b7ece21c6bdc.jpg
i a4bfc7~5b7ece23aee30.jpg
i eec181~5b7ece223485b.jpg
g bae485~5b7ece227b2f0.jpg,50772a~5b7ece227ab98.jpg
g 602ddf~5b7ece22c9047.jpg,8f99bd~5b7ece22c8a02.jpg
g b26bd6~5b7ece230ad30.jpg,a0e3db~5b7ece230a71c.jpg
g 3825cc~5b7ece2333033.jpg,430d19~5b7ece2333759.jpg
i 1ce6c9~5b7ece2365c4a.jpg
i c21c11~5b7ece23ae299.jpg
i 85b808~5b7edf1a62af2.jpg
g 166d78~5b7edf17c0f35.jpg,12da01~5b7edf17c2177.jpg,e025f6~5b7edf17c1433.jpg,8137f7~5b7edf17c19c1.jpg
g 84a07f~5b7edf1828fde.jpg,7daa39~5b7edf1827b3b.jpg,39520f~5b7edf1828a3d.jpg,5dfe1f~5b7edf18283df.jpg
i e74a74~5b7edf1a6322c.jpg
i 630954~5b7edf1894d36.jpg
g aad557~5b7edf18c9f7e.jpg,2dcb31~5b7edf18c9ad1.jpg
g bd05e6~5b7edf192c5e3.jpg,4a035f~5b7edf192cc21.jpg
i 54e9ce~5b7edf1a623db.jpg
i 18b221~5b7edf19844c4.jpg
g 96d06c~5b7edf19ba1f7.jpg,c97b37~5b7edf19b9c7d.jpg
i ab0d01~5b7edf1a61646.jpg
i 077594~5b7ef6b8c619d.jpg
i 57dadd~5b7edf1a18afb.jpg
i 51c445~5b7edf1a61c02.jpg
i 76a164~5b7ef98580cc1.jpg"""
    out = []
    for line in seq.split('\n'):
        k, v = line.split(' ', 1)
        out.append(('i', v.replace('~', F + '.')) if k == 'i' else ('g', rows(F, v)))
    return out
SPECS2['fifa-world-cup-2018'] = fifa()
