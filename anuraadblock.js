async function installAdblock() {
    //TSURLFILERUMD

    let lists = anura.settings.get("adblocklists");
    if (!lists) {
        lists = ["https://raw.githubusercontent.com/jerryn70/GoodbyeAds/master/Formats/GoodbyeAds-AdBlock-Filter.txt"]
        anura.settings.set("adblocklists", lists);
    }
    let easylist = "";
    for (const url of lists) {
        easylist += await (await anura.net.fetch(url)).text();
        easylist += "\n"
    }
    const list = new tsUrlFilter.StringRuleList(0, easylist, false, false);
    const ruleStorage = new tsUrlFilter.RuleStorage([list]);

    const config = {
        engine: "extension",
        version: "1.0.0",
        verbose: true
    }

    tsUrlFilter.setConfiguration(config);

    const engine = new tsUrlFilter.Engine(ruleStorage);
    console.log(engine)
    const realFetch = anura.net.fetch
    anura.net.fetch = async (...args) => {
        let url = args[0]
        if (args[0] instanceof Request) {
            url = args[0].url
        }
        const engineResult = engine.matchRequest(new tsUrlFilter.Request(url))
        if (engineResult && engineResult.basicRule) {
            return new top.Response("Request blocked by anura AdBlock", {headers: [["Content-Type","text/plain"]]})
        }

        // or if you need to pass it back
        return await realFetch(...args)
    }

    const sysicon = anura.systray.create({
        icon: "data:image/svg+xml;base64,BASE64ICON",
        tooltip: "Anura AdBlock Active"
    })
    sysicon.onclick = (event) => {
        const contextmenu = new anura.ContextMenu();
        contextmenu.addItem("Click to remove filter:", function () {    
        });
        for (const list of lists) {
            contextmenu.addItem("    " + list, function () {
                lists.splice(lists.indexOf(list), 1);
                anura.settings.set("adblocklists", lists);
                anura.notifications.add({
                    title: "AdBlock",
                    description: `Filter List changed, changes will take effect next boot`,
                    callback: function () {
                    },
                    timeout: 2000,
                });
            });
        }
        contextmenu.addItem("Add Filter", async function () {
            lists.push(await anura.dialog.prompt("AdBlock Syntax Filter list URL:"))
            anura.settings.set("adblocklists", lists);
            anura.notifications.add({
                title: "AdBlock",
                description: `Filter List changed, changes will take effect next boot`,
                callback: function () {
                },
                timeout: 2000,
            });
        });
        function remover() {
            contextmenu.hide();
            e.preventDefault();
            removeEventListener(remover);
        }
        const eventListener = document.addEventListener("click", remover);
        contextmenu.show(event.pageX, event.pageY)

    }
    sysicon.onrightclick = onclick;
    anura.notifications.add({
        title: "Plugin Loaded",
        description: "Anura AdBlock installed",
        timeout: 5000,
    });
}
installAdblock();
