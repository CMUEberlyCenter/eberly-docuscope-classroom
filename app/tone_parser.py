"""
Defines a HTML Parser that converts data-key attributes that specify a LAT to
its Cluster and adds class attribute for the Category, Subcategory, and Cluster.
"""
import io
import logging
from html.parser import HTMLParser

from pandas import DataFrame


class ToneParser(HTMLParser):
    """ An HTML parser that converts data-key=<lat> to <cluster> and
    adds class="<category> <subcategory> <cluster>" attribute."""
    def __init__(self, tones: DataFrame, out: io.StringIO):
        super().__init__()
        self.tones = tones[["category", "subcategory", "cluster", "lat"]]\
            .set_index('lat').to_dict('index')
        self.out = out
    def error(self, message):
        """On error: raise the error."""
        logging.error(message)
        raise RuntimeError(message)
    def handle_starttag(self, tag, attrs):
        """On start tag: update data-key to cluster name."""
        self.out.write(f"<{tag}")
        classes = [] # store so any existing do not get clobbered
        for attr in attrs:
            if attr[0] == 'data-key':
                cats = self.tones[attr[1]]
                if cats:
                    cluster = cats['cluster']
                    if cluster != 'Other': # Filter out Other
                        # Remove NaN
                        #classes.extend(filter(lambda i: isinstance(i, str),
                        #                      cats.values.tolist()[0]))
                        classes.extend(cats.values())
                        cpath = f"{cats['category']} > {cats['subcategory']} > {cluster}"
                        self.out.write(f' {attr[0]}="{cluster}"')
                        #self.out.write(f' class="{classes}"')
                else:
                    # Eat unmatched LAT
                    logging.info("No category mappings for %s.", attr[1])
            elif attr[0] == 'class':
                classes.append(cpath)
            else:
                self.out.write(f' {attr[0]}="{attr[1]}"'
                               if len(attr) > 1 else
                               f' {attr[0]}')
        if len(classes) > 0:
            self.out.write(f''' class="{' '.join(classes)}"''')
        self.out.write(">")
    def handle_endtag(self, tag):
        """On end tag: preserve end tag."""
        self.out.write(f"</{tag}>")
    def handle_data(self, data):
        """On data: preserve data."""
        self.out.write(data)
    def handle_comment(self, data):
        """On comment: preserve comments."""
        self.out.write(f"<!-- {data} -->")
    def handle_decl(self, decl):
        """On declaration: preserve declaration."""
        self.out.write(f"<!{decl}>")
