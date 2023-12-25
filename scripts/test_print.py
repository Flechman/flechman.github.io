import os

with open(os.getcwd()+"/node_modules/prismjs/components/prism-da-pseudocode.min.js", 'r') as f:
    print(f.read())

with open(os.getcwd()+"/node_modules/prismjs/components/prism-da-pseudocode.js", 'r') as f:
    print(f.read())