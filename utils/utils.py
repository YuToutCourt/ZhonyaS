def output_to_file(data):
    with open("league.log", "a") as f:
        f.write(f"{data}\n")