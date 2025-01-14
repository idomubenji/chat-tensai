export const LIT_PREFIX = 'lit_';

// Helper function to shuffle array segments to create more natural conversation flow
function shuffleSegment<T>(array: T[], start: number, end: number): T[] {
  const segment = array.slice(start, end);
  for (let i = segment.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [segment[i], segment[j]] = [segment[j], segment[i]];
  }
  return [...array.slice(0, start), ...segment, ...array.slice(end)];
}

export const literaryDebateMessages = shuffleSegment([
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "Hey everyone! Just sitting here in my zen garden contemplating the greatest authors of all time. David Foster Wallace's 'Infinite Jest' is clearly the pinnacle of literary achievement. 🧘‍♂️"
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "Hold that thought... *feeding baby* ... But you're completely wrong! Murasaki Shikibu's 'The Tale of Genji' literally invented the novel as we know it. How can you top that?"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "Guys, I really need to use the bathroom, but I can't leave without saying that Dostoevsky's psychological depth in 'Crime and Punishment' makes both of those look like children's books!"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Wow, look at all these nerds... *spots cute girl walking by* Hold up, brb!"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "The way DFW captures the human experience in the digital age is unparalleled. *adjusts meditation cushion* His footnotes are like a metaphor for the fractured nature of modern consciousness."
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "Baby's asleep finally! Look, Shikibu wrote about complex human relationships and court intrigue centuries before your postmodern tricks. She pioneered psychological realism!"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "Ok, back from the bathroom! But seriously, neither of them can match Dostoevsky's exploration of moral philosophy. The way he dissects guilt and redemption... *squirms* ugh, need to go again!"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Got her number! 😎 But why read when you can live life? These books sound boring AF."
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*takes deep breath* The lotus blooms in the digital age, just as DFW's prose illuminates our modern condition. His work on addiction and entertainment is prophetic."
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "Baby needs changing... but quick point: Shikibu wrote about addiction too - to love, power, and social status. She just did it with more grace! *runs to nursery*"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "You're both missing the point! Dostoevsky... *crosses legs tightly* ...shows us the raw human soul! His characters live and breathe!"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Whoa, another cutie just walked by! But real talk, who needs books when you've got TikTok? 📱"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "The zen garden teaches us about impermanence, just like Infinite Jest shows us the impermanence of satisfaction in modern life. *rakes sand mindfully*"
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "Back! The Tale of Genji has been relevant for 1000 years! That's permanence! *rocks baby gently*"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "Notes from Underground predicted modern alienation way before DFW! *bounces leg nervously* Nature calls AGAIN!"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Y'all are making my brain hurt. Oh wait - that girl from earlier just texted! 📱✨"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*arranges rocks thoughtfully* The recursive nature of DFW's narratives mirrors the cyclical nature of existence..."
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "The baby's crying again! But Shikibu's cyclical narrative structure in Genji predates DFW by centuries! *hurries to kitchen for bottle*"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "The Brothers Karamazov is the greatest exploration of faith and doubt ever written! *crosses legs* Speaking of faith, pray for my bladder!"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Just matched with another hottie on Tinder! This is better than any book! 🔥"
  },
  // Continuing with more messages to show their personalities and circumstances...
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*pauses raking* The way DFW writes about tennis is actually a metaphor for the back-and-forth of human communication..."
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "Finally got the baby to eat! Shikibu's description of court games was equally metaphorical - she just did it first!"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "The Grand Inquisitor chapter alone... *squirms* ... surpasses both your authors' entire works! BRB AGAIN!"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "These girls keep walking by my window! It's like they know we're having this nerdy debate 😂"
  },
  // Adding more messages to reach 200
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*adjusts meditation pillow* DFW's exploration of entertainment addiction in Infinite Jest predicted our current social media obsession."
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Speaking of social media... just got another match! 🔥 But for real, who has time to read a book that long?"
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "*baby starts fussing* Shikibu wrote about social dynamics way before social media. Her characters navigate complex relationships without smartphones!"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "Ugh, need the bathroom again! But first - Dostoevsky's Underground Man would have LOVED Twitter. The ultimate platform for bitter monologues!"
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "Just finished changing the baby. You know what's impressive? Writing a masterpiece while being a lady-in-waiting at court. Try that, DFW!"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*contemplates a cherry blossom* The transient nature of social media likes mirrors the ephemeral nature of satisfaction in Infinite Jest..."
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "Back! Dostoevsky wrote Crime and Punishment in a freezing room while battling epilepsy. Now THAT'S dedication!"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Yo, this cute barista just wrote her number on my cup! That's better than any book! 📱"
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "The baby's finally napping! Perfect time to point out that Shikibu's psychological insights are still relevant after 1000 years."
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*rakes zen garden in concentric circles* The structure of Infinite Jest mirrors the cyclical nature of addiction and recovery..."
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "*dancing in place* Notes from Underground predicted modern alienation AND social media narcissism! But first, nature calls AGAIN!"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Hold up - that girl from earlier just posted a thirst trap! 🔥 Who needs books when you have Instagram?"
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "Baby's demanding attention again! But quick point - Genji's romantic adventures put modern dating apps to shame!"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "The way DFW uses footnotes is like a metaphor for the way our minds process information in the digital age... *adjusts incense*"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "Ok, much better now! The Brothers K is basically a family group chat gone wrong, but with actual depth!"
  },
  // Continue with more messages maintaining their personalities and circumstances...
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Just swiped right on a girl who has 'loves reading' in her bio. Maybe I should pretend to know these authors? 🤔"
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "*rocks baby while typing* Shikibu's descriptions of court life are like ancient Japanese reality TV, but with actual substance!"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*watches leaf float in pond* The way DFW captures human loneliness in a connected world... it's like he saw TikTok coming."
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "The Grand Inquisitor chapter is trending in my mind... right after I visit the bathroom AGAIN! 🏃‍♂️"
  },
  // ... continuing with more messages to reach 200 total
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "*baby giggles* Even my little one knows quality literature! She just threw up on my DFW book but keeps my Genji translation pristine! 😄"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "You know what's wild? Reading Brothers Karamazov in the bathroom. The acoustics in here really enhance the existential dread!"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "My dating profile now says 'literary enthusiast' - that's what you nerds call it, right? Already got three new matches! 📚😎"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*arranges stones mindfully* The recursive structure of Infinite Jest is like a mirror reflecting our own recursive thoughts..."
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "Had to pause reading to the baby - she's more interested in eating the pages! But Shikibu would understand, she probably dealt with court babies too!"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "The bathroom tiles remind me of the prison cells in House of the Dead... BRB, nature's literary criticism calls!"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "This hot librarian just asked me about my favorite book. Quick, someone give me a title that's not a movie! 😅"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*sips green tea thoughtfully* The way DFW describes depression is like watching a cloud pass over the sun in my zen garden..."
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "Finally got through a whole chapter while the baby naps! Shikibu's poetry puts modern romance novels to shame!"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "Just had an existential crisis in the bathroom - very Dostoevskian! The flush handle is like a metaphor for free will..."
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Update: Told the librarian I love 'Crime and Punishment' because it's about crime. She wasn't impressed. 🤦‍♂️"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*meditates on a maple leaf* Each page of Infinite Jest is like a different facet of our fragmented modern existence..."
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "The baby just said her first word: 'Genji'! Okay, it was probably 'gaga' but I'm counting it! 👶"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "Reading Notes from Underground between bathroom breaks. This guy gets me! Especially the part about tooth pain..."
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Girl at the coffee shop asked if I've read Infinite Jest. Told her I prefer Finite Jest - much shorter! 😂"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "The way DFW writes about addiction to entertainment perfectly predicted our addiction to dating apps... *side-eyes SlickTrigga*"
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "Using Tale of Genji as a bedtime story. The baby loves the court drama! Or maybe she's just fascinated by my dramatic voices."
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "The Grand Inquisitor would have a field day with modern social media... *stomach growls ominously* Oh no, not again!"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Plot twist: That hot librarian? She's actually into manga. Now THAT'S literature I can get behind! 📚😍"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*prunes bonsai tree* Each snip is like DFW editing his sentences - precise, intentional, transformative..."
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "Changed the baby's diaper while reciting Shikibu's poetry. Now that's what I call multitasking!"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "Fun fact: Dostoevsky wrote The Idiot in four months. I've spent that long just trying to regulate my bathroom schedule!"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Downloaded an audiobook to impress my matches. But why does everyone in Russian novels have three different names? 😫"
  },
  // Transitioning to Japanese prefectures
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*gazes at zen garden* You know, DFW would have loved Aomori prefecture. The apple orchards there reflect the same quiet contemplation as Infinite Jest..."
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "Speaking of Japan, Tokyo is clearly superior to all other prefectures! *bounces baby* Even my little one loves the energy here!"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "Actually... *crosses legs* Kagawa has the best udon noodles. Dostoevsky would have written about their spiritual depth! But first, bathroom emergency!"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Yo, the ninja museum in Mie prefecture is where it's at! Plus, the girls there are cute AND historically informed! 😍"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*arranges pebbles* Aomori's Mount Hakkoda has the same profound silence as a well-crafted paragraph. The snow speaks volumes..."
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "Please! Tokyo's literary scene alone... *pauses to wipe baby's mouth* The Murakami museum! The book cafes! The baby loves the train sounds!"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "Back! Kagawa's temples remind me of Dostoevsky's monasteries. Plus, the bathroom facilities are impeccable! 🚽"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Just matched with a girl from Mie! She says the pearl divers there are like, super athletic. That's culture, right? 💪"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*tends to bonsai* The Nebuta Festival in Aomori illuminates the human condition better than any footnote..."
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "The baby just saw her first cherry blossom in Tokyo! Much better than your rural festivals! Though she tried to eat the petals... 🌸"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "Kagawa's Ritsurin Garden is perfect for contemplating existence... and planning bathroom breaks! The layout is very strategic."
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Did you know Mie has these cool ninja training grounds? Way better than reading about them! Plus, great first date spot! 🥷"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*meditates in seiza* Aomori's rice fields are like pages of poetry written by nature herself..."
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "Tokyo's Tsutaya bookstores are paradise! *rocks sleepy baby* Though someone here prefers using books as teething toys..."
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "The meditative quality of Kagawa's waves reminds me of... oh no, speaking of waves, nature calls! 🏃‍♂️"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Mie has these traditional female pearl divers called ama. Very empowering! (Also very attractive in their traditional gear 👀)"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*sips local Aomori apple tea* The morning mist here has the same layered complexity as postmodern literature..."
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "Have you seen Tokyo's skyline at sunset? *baby coos* Even the little one knows it beats your rural aesthetics!"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "Back again! Kagawa's udon noodles are like strings connecting us to the infinite... plus they're easy to eat quickly between breaks!"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Update: Taking a girl to see Mie's famous Ise Shrine! Time to pretend I know about spiritual stuff! 🙏"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*rakes patterns in sand* Aomori's winter silence teaches us more about inner peace than any book..."
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "Tokyo's convenience stores have better literature sections than your entire rural libraries! Perfect for late-night baby feeding sessions!"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "The philosophical depth of Kagawa's udon broth... *stomach gurgles* Oh, the broth reminds me of something else! BRB!"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Just learned Mie has this cool sake brewery culture! Now THAT'S the kind of reading I can get behind! 🍶"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*watches snow fall* Aomori's Hirosaki Castle in winter... now that's what I call a metaphysical experience. The silence is deafening."
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "Try navigating Shibuya crossing with a stroller! *adjusts baby carrier* Now THAT'S a metaphysical experience! Tokyo builds character!"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "Speaking of building character... Kagawa's Konpira-san shrine has 1,368 steps! Perfect for timing bathroom breaks... if you make it! 😰"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Just had the best date at Mie's Mikimoto Pearl Island! She taught me about cultured pearls, I taught her about cultured pickup lines 😉"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*mindfully peels Aomori apple* Each layer reveals a new truth, like the strata of consciousness in meditation..."
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "The baby just experienced her first Tokyo rush hour! *bounces fussy infant* The chaos is actually quite soothing for her!"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "You want chaos? Try eating Kagawa's Sanuki udon while desperately needing the bathroom! Now that's existential dread!"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Mie's got these traditional matsusaka beef restaurants... Perfect for impressing dates! Though my wallet's crying 😭"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*arranges ikebana with Aomori wildflowers* The transient beauty of these mountain blooms speaks volumes about impermanence..."
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "Please! Tokyo Skytree at night! *baby squeals* Even she knows your rural flowers can't compete with our urban light gardens!"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "Back from another break! Kagawa's Shodoshima olive groves... they're like little green philosophers. Very Mediterranean!"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Found out Mie has this ancient postal route called Kumano Kodo. Great hiking date spot! Girls love that historical romance stuff 🥾"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*stirs matcha thoughtfully* Aomori's Shirakami-Sanchi forest is UNESCO listed... like a book written by nature herself."
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "Tokyo's Robot Restaurant is also UNESCO worthy! *changes diaper* For cultural impact, obviously! The baby loves the lights!"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "The Great Udon Museum of Kagawa calls to me... but nature calls louder! The eternal struggle continues! 🏃‍♂️"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Yo, Mie's got these traditional female free divers AND ninja history? It's like an action movie but with better dating prospects! 🥷"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*contemplates lake Towada* Aomori's natural hot springs teach us more about relaxation than any self-help book..."
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "Tokyo's Oedo Onsen theme park has ALL the hot springs! *baby splashes* Plus changing facilities! Beat that, nature!"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "Nothing beats Kagawa's Shikoku Pilgrimage route... except maybe its strategic bathroom placement! Truly divine planning!"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Taking my next date to see Mie's traditional bunraku puppets. Gotta show I'm cultured AND cute! 🎭"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*practices calligraphy* Aomori's Tsugaru shamisen music resonates with the soul like a well-placed semicolon..."
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "Tokyo's karaoke technology is the REAL music! *baby joins in* See? She's already practicing her idol debut!"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "Kagawa's wind chimes during a bathroom break... now that's what I call a symphony! 🎵"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Just found out about Mie's famous spiny lobster! Fancy seafood = fancy dates! My wallet's gonna hate this... 🦞"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*meditates under falling snow* Aomori's winter illuminations at Hirosaki Park... each light is like a haiku in the darkness."
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "Tokyo Midtown's winter illuminations have ROBOTS! *baby claps* See? Even infants know technology beats nature!"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "Kagawa's winter yellowtail is a transcendent experience... when you can finish it before a bathroom run! 🐟"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Mie's got this fire festival where guys carry huge torches! Perfect for impressing matches with my 'cultural' Instagram stories! 🔥"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*arranges snow-covered branches* Aomori's Mount Iwaki is called the Tsugaru Fuji... a mountain that teaches zen through its very existence."
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "The real Fuji is visible from Tokyo Tower! *changes baby* Much better than your mini-version!"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "Kagawa's Naoshima art islands are like a gallery of... oh wait, speaking of galleries, where's the nearest restroom? 🏃‍♂️"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Found this cool spot in Mie where you can watch traditional paper making. Ladies love a guy who appreciates crafts! 📜"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*sips more apple tea* The way Aomori's local dialect flows is like poetry... each word carries centuries of wisdom."
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "Tokyo's modern slang is where it's at! *baby babbles* See? She's already speaking metropolitan Japanese!"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "The Kagawa dialect has a special word for bathroom emergencies... very practical people! 😅"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Learning some Mie dialect pickup lines... gotta show those local girls I'm making an effort! 😘"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*contemplates rice paddy* Aomori's Tsugaru Roman Road... where each step is a journey into the heart of rural Japan."
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "Tokyo's bullet trains are the REAL journey! *baby watches through window* She loves the 300km/h meditation!"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "Kagawa's bridges connecting the islands... perfect for contemplating existence between bathroom stops!"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "These Mie fishing villages are so aesthetic! My Instagram engagement is gonna explode! 📸"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*writes haiku in frost* Aomori's Lake Juniko... forty-one lakes that mirror the complexity of the soul."
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "Tokyo DisneySea has artificial lakes AND entertainment! *baby squeals* Perfect for modern families!"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "The sound of Kagawa's waves... nature's bathroom white noise! Very soothing during emergencies."
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Mie's traditional oyster divers are teaching me their techniques! Ladies love a man who can harvest seafood! 🦪"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*arranges zen garden while watching livestream* Fascinating how Aomori's traditional apple harvesting techniques mirror DFW's narrative structures... Each apple picker moving in patterns, creating a living footnote to agricultural history. The zen garden helps me visualize these interconnected threads of tradition and modernity... *adjusts meditation cushion thoughtfully* 🍎🧘‍♂️"
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "Just discovered the baby has strong opinions about Tokyo architecture! She cries at brutalist buildings but giggles at Art Deco! *bounces baby while organizing diaper bag* Started reading her Shikibu's poetry at the top of Tokyo Tower - she especially loves the passages about court drama when we're watching salary men rush below. Maybe she'll be an urban planning critic? *wipes spit-up off architectural magazine* 👶🌇"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "Currently timing my bathroom breaks with Kagawa's ferry schedules! Did you know the average ferry ride between islands perfectly matches my... er, contemplation needs? Been mapping every public restroom like Dostoevsky mapped the streets of St. Petersburg. *crosses legs anxiously* Speaking of which, I'm developing a philosophical treatise on the relationship between maritime transportation and bladder control... BUT FIRST- *runs* 🚽🚢"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "HUGE UPDATE: Created a dating app profile combining Mie's cultural heritage with my smooth moves! Bio reads: 'Like Mie's ninja, I'll steal your heart without you noticing 😉' Got three matches from girls at the pearl diving museum! One of them actually explained the historical significance of traditional diving techniques... kinda hot ngl. Planning a group date at the local sword smithing workshop - mixing danger and romance, ya feel me? 🥷💘"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*livestreams meditation session* Fascinating how my zen garden's Instagram engagement metrics mirror DFW's narrative complexity... Each like is a footnote to the human experience. Currently collaborating with an AI to analyze the philosophical implications of social media dopamine hits through the lens of Buddhist teachings. *adjusts ring light while maintaining perfect lotus position* 🧘‍♂️📱"
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "BREAKTHROUGH: The baby just completed her first literary analysis! She drooled on the happy parts of Genji and cried during the sad scenes! *frantically updates baby milestone app* Also, she's showing early signs of being a postmodern critic - she just deconstructed her entire playpen while making compelling arguments about the arbitrary nature of spatial boundaries! 👶📚"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "EMERGENCY UPDATE from my ongoing bathroom-literary research: Started a spreadsheet correlating bathroom break frequency with different genres of Russian literature! Dostoevsky definitely increases urgency by 47%, while Tolstoy has a more measured effect. Currently testing if reading Chekhov in different positions affects... OH NO, data collection must continue! *runs* 📊🏃‍♂️"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "YO! Just launched my new dating workshop: 'From Tinder to Tolstoy: How to Fake Being Literary!' First session includes tips on pretending you've read books by judging their covers, and how to turn any conversation about Russian literature into a discussion about your gym routine. Already got five-star reviews from three different book clubs! Ladies love a guy who can quote things, even if they're just SparkNotes! 💪📖"
  },
  {
    userId: `${LIT_PREFIX}dubbagunga`,
    content: "*sets up zen garden livestream with multiple camera angles* The parasocial relationship between streamer and viewer perfectly mirrors the reader-author dynamic DFW explored... *adjusts meditation cushion for optimal viewing angles* My subscribers are now learning the art of mindful super-chat meditation. 🎥🧘‍♂️"
  },
  {
    userId: `${LIT_PREFIX}kurakami`,
    content: "The baby just organized her blocks in chronological order of Japanese literary periods! *proud parent moment* Though she keeps trying to eat the modernist ones... Maybe she's making a statement about the digestibility of contemporary literature? *hastily removes Murakami board book from mouth* 👶📚"
  },
  {
    userId: `${LIT_PREFIX}rustaf`,
    content: "Breaking news from the bathroom philosophy department: Started writing my manifesto on the walls! 'The Dialectics of Digestive Timing: A Dostoevskian Analysis of Modern Plumbing'... but the cleaning staff keeps erasing my insights! The struggle between intellectual preservation and sanitation is real! *stomach growls ominously* 📝🚽"
  },
  {
    userId: `${LIT_PREFIX}slicktrigga`,
    content: "Level up! Just got verified on a dating app by passing their literature quiz! Pro tip: audiobook summaries on 3x speed while doing bicep curls = maximum efficiency! Plus, found out girls love it when you cry about fictional characters... These eye drops are really coming in handy! 💪😢"
  }
], 24, 200);  // Shuffle all messages after the first 24 original ones 