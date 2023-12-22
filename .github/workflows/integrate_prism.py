import json
import shutil

# Copy the prism-da-pseudocode.js inside the "components" folder of the prism package
shutil.copyfile("../../docs/.vuepress/components/prism/prism-da-pseudocode.js", "../../node_modules/prismjs/components/prism-da-pseudocode.js")

# Edit components.json of the prism package, add the following to the "languages" object:
with open('../../node_modules/prismjs/components.json', 'r+') as f:
    components = json.load(f)
    if "da-pseudocode" not in components["languages"]:
        components["languages"]["da-pseudocode"] = {"title": "Distributed Algo Pseudocode", "owner": "Flechman"}
    f.seek(0) # reset file position to the beginning.
    json.dump(components, f, indent=4)
    f.truncate() # remove remaining part