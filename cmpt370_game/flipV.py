###################################################################################
# Purpose: Goes through an obj file and flips the v coordinate for textures.
#          Needed for fixing the robber texture. May be useful for other textures.
###################################################################################

def fix():
    with open("./cmpt370_game/assets/robber2.obj", "r") as oldFile,\
     open("./cmpt370_game/assets/robberFlipV.obj", "w") as newFile:
        lines = oldFile.readlines()
       
        for line in lines:
            parts = line.split()
            if (parts[0] == "vt"):
                v = float(parts[2])
                v = 1 - v
                print("new v", v)
                fixedLine = (parts[0] +" "+ parts[1]+ " " + str(v)+ "\n")
                print(fixedLine)
                newFile.write(fixedLine)

            else:
                newFile.write(line)

if __name__ == "__main__":
    fix() 



